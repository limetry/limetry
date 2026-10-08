import * as azure from "@pulumi/azure"
import * as azureNative from "@pulumi/azure-native"
import * as dockerbuild from "@pulumi/docker-build"
import type { RegistryArgs } from "@pulumi/docker-build/types/input"
import * as pulumi from "@pulumi/pulumi"

import { createNeonDatabase } from "./neon"
import type { ServerlessProviderArgs, ServerlessProviderResources } from "./types"
import type { ServerlessDnsRecord } from "./types"

/**
 * Creates an Azure Container Apps and optional PostgreSQL deployment.
 *
 * SQLite is stored in the container's ephemeral filesystem by default. Azure
 * PostgreSQL Flexible Server uses public access only when explicitly enabled
 * because Container Apps egress addresses are not stable without VNet design.
 *
 * @param args - Shared serverless deployment inputs.
 * @returns Azure serverless resources and the public API URL.
 */
export function createAzureProvider(args: ServerlessProviderArgs): ServerlessProviderResources {
  /** Resource group containing the serverless resources. */
  const resourceGroup = new azureNative.resources.ResourceGroup(`${args.name}-resource-group`, {
    location: args.config.location,
  })

  /** Azure Container Registry created for the server image. */
  const registry = args.config.apiImageRepository
    ? undefined
    : new azureNative.containerregistry.Registry(`${args.name}-registry`, {
      adminUserEnabled: true,
      location: args.config.location,
      resourceGroupName: resourceGroup.name,
      sku: { name: "Basic" },
    })

  /** ACR image repository reference used by Container Apps. */
  const imageRepository = args.config.apiImageRepository
    ?? pulumi.interpolate`${registry?.loginServer}/${args.name}/api`

  /** ACR credentials used by the Docker image builder. */
  const registryCredentials = registry
    ? azureNative.containerregistry.listRegistryCredentialsOutput({
      registryName: registry.name,
      resourceGroupName: resourceGroup.name,
    })
    : undefined

  /** Docker registry credentials passed to the image builder. */
  const registries: pulumi.Input<RegistryArgs[]> | undefined = registry && registryCredentials
    ? [{
      address: registry.loginServer,
      password: pulumi.secret(registryCredentials.apply((value) => value.passwords?.[0]?.value ?? "")),
      username: registryCredentials.apply((value) => value.username),
    }]
    : undefined

  /** API container image built from the repository Dockerfile. */
  const image = new dockerbuild.Image(`${args.name}-image`, {
    buildOnPreview: false,
    context: { location: args.repoRoot },
    dockerfile: { location: `${args.repoRoot}/packages/server/Dockerfile` },
    platforms: ["linux/amd64"],
    push: true,
    registries,
    tags: [pulumi.interpolate`${imageRepository}:${args.config.apiImageTag}`],
  })

  /** Azure Container Apps environment. */
  const environment = new azureNative.app.ManagedEnvironment(`${args.name}-environment`, {
    location: args.config.location,
    resourceGroupName: resourceGroup.name,
  })

  const managedCertificate = args.config.apiDomain
    ? new azureNative.app.ManagedCertificate(`${args.name}-certificate`, {
      environmentName: environment.name,
      location: args.config.location,
      managedCertificateName: `${args.name}-certificate`,
      properties: {
        domainControlValidation: "CNAME",
        subjectName: args.config.apiDomain,
      },
      resourceGroupName: resourceGroup.name,
    })
    : undefined

  /** Optional PostgreSQL Flexible Server connection details. */
  const database = args.config.databaseProvider === "neon"
    ? createNeonDatabase(args)
    : args.config.databaseProvider === "rds"
      ? createAzureDatabase(args, resourceGroup.name)
      : undefined

  /** Container App environment variables for the selected persistence mode. */
  const serverEnvironment = database
    ? {
      ...args.environment,
      DATABASE_URL: database.connectionString,
      USE_POSTGRES_STORE: "true",
    }
    : args.environment

  /** Container App registry secret definitions. */
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

  /** Azure Container App hosting the Limetry API. */
  const containerApp = new azureNative.app.ContainerApp(`${args.name}-api`, {
    configuration: {
      ...containerRegistryConfiguration,
      ingress: {
        customDomains: managedCertificate && args.config.apiDomain
          ? [{
            bindingType: "SniEnabled",
            certificateId: managedCertificate.id,
            name: args.config.apiDomain,
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
        image: image.ref,
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

  if (managedCertificate && args.config.apiDomain && args.createDnsRecords) {
    args.createDnsRecords("domain", [{
      content: containerApp.latestRevisionFqdn,
      name: args.config.apiDomain,
      type: "CNAME",
    } satisfies ServerlessDnsRecord])
  }

  return {
    apiImageReference: image.ref,
    apiUrl: args.config.apiDomain
      ? pulumi.interpolate`https://${args.config.apiDomain}`
      : pulumi.interpolate`https://${containerApp.latestRevisionFqdn}`,
    managedDatabaseConnection: database?.connectionString,
  }
}

/**
 * Creates a low-cost Azure PostgreSQL Flexible Server.
 *
 * @param args - Shared serverless deployment inputs.
 * @param resourceGroupName - Resource group for the database.
 * @returns PostgreSQL connection details.
 */
function createAzureDatabase(
  args: ServerlessProviderArgs,
  resourceGroupName: pulumi.Input<string>,
): {
  connectionString: pulumi.Output<string>
} {
  if (!args.config.allowPublicDatabase) {
    throw new Error(
      "Azure managed database requires allowPublicDatabase=true; use VNet integration for private production connectivity",
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
  const _firewall = new azure.postgresql.FlexibleServerFirewallRule(`${args.name}-database-firewall`, {
    endIpAddress: "0.0.0.0",
    name: `${args.name}-container-apps`,
    serverId: server.id,
    startIpAddress: "0.0.0.0",
  })

  /** PostgreSQL connection string used by Container Apps. */
  const connectionString = pulumi.secret(pulumi.interpolate`postgresql://${args.config.databaseUsername}:${args.secrets.databasePassword}@${server.fqdn}:5432/${args.config.databaseName}?sslmode=require`)

  return { connectionString }
}
