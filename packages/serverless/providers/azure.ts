import type { ProviderArgs, ProviderResources } from "./types"

/**
 * Creates an Azure Container Apps deployment and optional PostgreSQL database.
 *
 * @param args - Shared deployment inputs.
 * @returns Azure resources and their public URL.
 */
export async function createAzureProvider(args: ProviderArgs): Promise<ProviderResources> {
  /** Resource group containing the serverless resources. */
  const resourceGroup = new azurenative.resources.ResourceGroup(`${args.name}-resource-group`, {
    location: args.config.location,
  })

  /** Container Registry created when no external image repository is supplied. */
  const registry = args.config.apiImageRepository
    ? undefined
    : new azurenative.containerregistry.Registry(`${args.name}-registry`, {
      adminUserEnabled: true,
      location: args.config.location,
      resourceGroupName: resourceGroup.name,
      sku: { name: "Basic" },
    })

  /** ACR image repository used by Container Apps. */
  const imageRepository = args.config.apiImageRepository
    ?? $util.interpolate`${registry?.loginServer}/${args.name}/api`

  /** ACR credentials used to push the managed image. */
  const registryCredentials = registry
    ? azurenative.containerregistry.listRegistryCredentialsOutput({
      registryName: registry.name,
      resourceGroupName: resourceGroup.name,
    })
    : undefined

  /** Docker registry credentials passed to the image builder. */
  const registries = registry && registryCredentials
    ? [{
      address: registry.loginServer,
      password: $util.secret(registryCredentials.apply((value) => value.passwords?.[0]?.value ?? "")),
      username: registryCredentials.apply((value) => value.username),
    }]
    : undefined

  /** Container image built only when the stack owns the image repository. */
  const image = registry
    ? new dockerbuild.Image(`${args.name}-image`, {
      buildOnPreview: false,
      context: { location: args.repoRoot },
      dockerfile: { location: `${args.repoRoot}/packages/server/Dockerfile` },
      platforms: ["linux/amd64"],
      push: true,
      registries,
      tags: [$util.interpolate`${imageRepository}:${args.config.apiImageTag}`],
    })
    : undefined
  const imageReference = image
    ? image.ref
    : `${imageRepository}:${args.config.apiImageTag}`

  /** Container Apps environment hosting the API. */
  const environment = new azurenative.app.ManagedEnvironment(`${args.name}-environment`, {
    location: args.config.location,
    resourceGroupName: resourceGroup.name,
  })

  /** Optional PostgreSQL Flexible Server connection details. */
  const neonDatabase = args.config.databaseProvider === "neon"
    ? (await import("./neon.js")).createNeonDatabase(args)
    : undefined
  const database = neonDatabase ?? (args.config.databaseProvider === "rds"
    ? createDatabase(args, resourceGroup.name)
    : undefined)

  /** Container App environment variables for the selected persistence mode. */
  const serverEnvironment = database
    ? {
      ...args.environment,
      DATABASE_URL: database.connectionString,
      USE_POSTGRES_STORE: "true",
    }
    : args.environment

  /** Container registry credentials available to the Container App. */
  const containerRegistryConfiguration = registry && registryCredentials
    ? {
      registries: [{
        passwordSecretRef: "registry-password",
        server: registry.loginServer,
        username: registryCredentials.apply((value) => value.username),
      }],
      secrets: [{
        name: "registry-password",
        value: registryCredentials.apply((value) => value.passwords?.[0]?.value ?? ""),
      }],
    }
    : undefined

  /** Custom hostname configured for the Container App. */
  const apiDomain = args.config.apiDomain

  /** Azure Container App hosting the Limetry API. */
  const containerApp = new azurenative.app.ContainerApp(`${args.name}-api`, {
    configuration: {
      ...containerRegistryConfiguration,
      ingress: {
        customDomains: apiDomain
          ? [{
            bindingType: args.config.apiCertificateId ? "SniEnabled" : "Disabled",
            certificateId: args.config.apiCertificateId,
            name: apiDomain,
          }]
          : undefined,
        external: true,
        targetPort: 3810,
        transport: "auto",
      },
    },
    environmentId: environment.id,
    location: args.config.location,
    resourceGroupName: resourceGroup.name,
    template: {
      containers: [{
        env: Object.entries(serverEnvironment).map(([name, value]) => ({ name, value })),
        image: imageReference,
        name: "limetry",
        resources: {
          cpu: Math.min(2, Math.max(0.5, args.config.memoryMb / 1024)),
          memory: `${Math.max(0.5, args.config.memoryMb / 1024)}Gi`,
        },
      }],
      scale: {
        maxReplicas: args.config.maxInstances,
        minReplicas: args.config.minInstances,
      },
    },
  })

  /** DNS records needed when a custom Azure hostname is configured. */
  const dnsRecords = apiDomain
    ? $util.all([containerApp.latestRevisionFqdn, containerApp.customDomainVerificationId]).apply(
      ([fqdn, verificationId]) => [
        { content: fqdn, name: apiDomain, type: "CNAME" as const },
        { content: verificationId, name: `asuid.${apiDomain}`, type: "TXT" as const },
      ],
    )
    : undefined

  return {
    apiImageReference: imageReference,
    apiUrl: args.config.apiDomain
      ? $util.interpolate`${args.config.apiCertificateId ? "https" : "http"}://${args.config.apiDomain}`
      : $util.interpolate`https://${containerApp.latestRevisionFqdn}`,
    dnsRecords,
    managedDatabaseConnection: database?.connectionString,
    managedDatabaseHost: neonDatabase?.host,
    provider: "azure",
  }
}

/**
 * Creates the lowest-cost supported Azure PostgreSQL Flexible Server.
 *
 * @param args - Shared deployment inputs.
 * @param resourceGroupName - Resource group for the database.
 * @returns PostgreSQL connection details.
 */
function createDatabase(
  args: ProviderArgs,
  resourceGroupName: $util.Input<string>,
): {
  connectionString: $util.Output<string>
} {
  if (!args.config.allowPublicDatabase) {
    throw new Error(
      "Azure managed database requires LIMETRY_ALLOW_PUBLIC_DATABASE=true; use VNet integration for private production connectivity",
    )
  }

  /** Lowest-cost burstable PostgreSQL Flexible Server tier. */
  const server = new azure.postgresql.FlexibleServer(`${args.name}-database`, {
    administratorLogin: args.config.databaseUsername,
    administratorPassword: args.secrets.databasePassword,
    location: args.config.location,
    name: `${args.name}-postgres`,
    publicNetworkAccessEnabled: true,
    resourceGroupName,
    skuName: "B_Standard_B1ms",
    storageMb: 32768,
    version: "16",
  })

  /** Application database created in PostgreSQL Flexible Server. */
  const _database = new azure.postgresql.FlexibleServerDatabase(`${args.name}-database-schema`, {
    name: args.config.databaseName,
    serverId: server.id,
  })

  /** Temporary public firewall rule required by Container Apps without VNet integration. */
  const _firewall = new azure.postgresql.FlexibleServerFirewallRule(`${args.name}-container-apps`, {
    endIpAddress: "0.0.0.0",
    name: `${args.name}-container-apps`,
    serverId: server.id,
    startIpAddress: "0.0.0.0",
  })

  /** PostgreSQL connection string consumed by Container Apps. */
  const connectionString = $util.secret($util.all([
    server.fqdn,
    _database.id,
    _firewall.id,
    args.secrets.databasePassword,
  ]).apply(([fqdn, databaseId, firewallId, password]) => {
    if (!databaseId || !firewallId) {
      throw new Error("Azure PostgreSQL resources were not created")
    }
    return `postgresql://${args.config.databaseUsername}:${password}@${fqdn}:5432/${args.config.databaseName}?sslmode=require`
  }))

  return { connectionString }
}
