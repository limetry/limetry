import type { DnsRecord, ProviderArgs, ProviderResources } from "./types"

/**
 * Creates a Cloud Run deployment and optional Cloud SQL database.
 *
 * @param args - Shared deployment inputs.
 * @returns GCP resources and their public URL.
 */
export function createGcpProvider(args: ProviderArgs): ProviderResources {
  /** GCP project selected by the provider credentials. */
  const clientConfig = gcp.organizations.getClientConfigOutput()

  /** Project used by Artifact Registry, Cloud Run, and Cloud SQL. */
  const project = gcp.config.project ?? clientConfig.project

  /** Artifact Registry repository created when no image repository is supplied. */
  const repository = args.config.apiImageRepository
    ? undefined
    : new gcp.artifactregistry.Repository(`${args.name}-registry`, {
      description: "Limetry API serverless image",
      format: "DOCKER",
      location: args.config.location,
      repositoryId: `${args.name}-images`,
    })

  /** Fully qualified image repository used by Cloud Run. */
  const imageRepository = args.config.apiImageRepository
    ?? $util.interpolate`${args.config.location}-docker.pkg.dev/${project}/${repository?.repositoryId}/api`

  /** Registry hostname used by the Docker builder. */
  const registryAddress = `${args.config.location}-docker.pkg.dev`

  /** Credentials used to push an image into the managed Artifact Registry. */
  const registries = repository
    ? [{
      address: registryAddress,
      password: $util.secret(clientConfig.accessToken),
      username: "oauth2accesstoken",
    }]
    : undefined

  /** Container image built only when the stack owns the image repository. */
  const image = repository
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

  /** Cloud Run service account used by the API container. */
  const serviceAccount = new gcp.serviceaccount.Account(`${args.name}-runtime`, {
    accountId: `${args.name}-runtime`,
    displayName: "Limetry serverless runtime",
    project,
  })

  /** Optional Cloud SQL PostgreSQL connection details. */
  const database = args.config.managedDatabase
    ? createDatabase(args, project, serviceAccount)
    : undefined

  /** Cloud Run environment variables for the selected persistence mode. */
  const environment = database
    ? {
      ...args.environment,
      DATABASE_URL: database.connectionString,
      USE_POSTGRES_STORE: "true",
    }
    : args.environment

  /** Cloud Run service hosting the Limetry API. */
  const service = new gcp.cloudrunv2.Service(`${args.name}-api`, {
    deletionProtection: false,
    ingress: "INGRESS_TRAFFIC_ALL",
    location: args.config.location,
    name: args.name,
    project,
    template: {
      containers: [{
        envs: Object.entries(environment).map(([name, value]) => ({ name, value })),
        image: imageReference,
        ports: { containerPort: 3810 },
        resources: {
          limits: {
            memory: `${args.config.memoryMb}Mi`,
          },
        },
        volumeMounts: database
          ? [{ mountPath: "/cloudsql", name: "cloudsql" }]
          : undefined,
      }],
      scaling: {
        maxInstanceCount: args.config.maxInstances,
        minInstanceCount: args.config.minInstances,
      },
      serviceAccount: serviceAccount.email,
      timeout: `${args.config.timeoutSeconds}s`,
      volumes: database
        ? [{
          cloudSqlInstance: { instances: [database.connectionName] },
          name: "cloudsql",
        }]
        : undefined,
    },
  })

  /** Public Cloud Run invoker permission. */
  const _invoker = new gcp.cloudrunv2.ServiceIamMember(`${args.name}-invoker`, {
    location: service.location,
    member: "allUsers",
    name: service.name,
    project,
    role: "roles/run.invoker",
  })

  /** Optional Cloud Run domain mapping for a configured custom hostname. */
  const domainMapping = args.config.apiDomain
    ? new gcp.cloudrun.DomainMapping(`${args.name}-domain`, {
      location: args.config.location,
      metadata: {
        namespace: project,
      },
      name: args.config.apiDomain,
      project,
      spec: {
        routeName: service.name,
      },
    })
    : undefined

  return {
    apiImageReference: imageReference,
    apiUrl: args.config.apiDomain
      ? $util.interpolate`https://${args.config.apiDomain}`
      : $util.all([service.uri, _invoker.id]).apply(([uri]) => uri),
    dnsRecords: domainMapping
      ? domainMapping.statuses.apply((statuses) => statuses.flatMap((status) => status.resourceRecords ?? []).map((record): DnsRecord => ({
        content: record.rrdata,
        name: record.name,
        type: record.type === "CNAME" ? "CNAME" : "A",
      })))
      : undefined,
    managedDatabaseConnection: database?.connectionString,
    provider: "gcp",
  }
}

/**
 * Creates a low-cost Cloud SQL PostgreSQL instance for Cloud Run.
 *
 * @param args - Shared deployment inputs.
 * @param project - GCP project identifier.
 * @param serviceAccount - Cloud Run runtime identity.
 * @returns Cloud SQL connection details.
 */
function createDatabase(
  args: ProviderArgs,
  project: $util.Input<string>,
  serviceAccount: gcp.serviceaccount.Account,
): {
  connectionName: $util.Output<string>
  connectionString: $util.Output<string>
} {
  /** Smallest shared-core Cloud SQL PostgreSQL instance. */
  const instance = new gcp.sql.DatabaseInstance(`${args.name}-database`, {
    databaseVersion: "POSTGRES_16",
    deletionProtection: false,
    project,
    region: args.config.location,
    settings: {
      availabilityType: "ZONAL",
      diskAutoresize: true,
      diskSize: 10,
      ipConfiguration: { ipv4Enabled: true },
      tier: "db-f1-micro",
    },
  })

  /** Application database created in Cloud SQL. */
  const _database = new gcp.sql.Database(`${args.name}-database-schema`, {
    instance: instance.name,
    name: args.config.databaseName,
    project,
  })

  /** Database user created for the Limetry server. */
  const _user = new gcp.sql.User(`${args.name}-database-user`, {
    instance: instance.name,
    name: args.config.databaseUsername,
    password: args.secrets.databasePassword,
    project,
  })

  /** Cloud SQL Client permission for the Cloud Run identity. */
  const _clientRole = new gcp.projects.IAMMember(`${args.name}-database-client`, {
    member: $util.interpolate`serviceAccount:${serviceAccount.email}`,
    project,
    role: "roles/cloudsql.client",
  })

  /** PostgreSQL connection string using the Cloud SQL Unix socket. */
  const connectionString = $util.secret($util.all([
    instance.connectionName,
    _database.id,
    _user.id,
    _clientRole.id,
    args.secrets.databasePassword,
  ]).apply(([connectionName, databaseId, userId, roleId, password]) => {
    if (!databaseId || !userId || !roleId) {
      throw new Error("Cloud SQL resources were not created")
    }
    return `postgresql://${args.config.databaseUsername}:${password}@/${args.config.databaseName}?host=/cloudsql/${connectionName}`
  }))

  return {
    connectionName: instance.connectionName,
    connectionString,
  }
}
