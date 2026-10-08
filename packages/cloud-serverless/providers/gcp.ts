import * as dockerbuild from "@pulumi/docker-build"
import type { RegistryArgs } from "@pulumi/docker-build/types/input"
import * as gcp from "@pulumi/gcp"
import * as pulumi from "@pulumi/pulumi"

import type { ServerlessProviderArgs, ServerlessProviderResources } from "./types"

/**
 * Creates a Google Cloud Run and optional Cloud SQL deployment.
 *
 * SQLite is stored in the container's ephemeral filesystem by default. The
 * managed database option uses the smallest shared-core Cloud SQL PostgreSQL
 * instance supported by the provider and mounts its Unix socket into Cloud Run.
 *
 * @param args - Shared serverless deployment inputs.
 * @returns GCP serverless resources and the public API URL.
 */
export function createGcpProvider(args: ServerlessProviderArgs): ServerlessProviderResources {
  /** GCP client configuration used for project and registry authentication. */
  const clientConfig = gcp.organizations.getClientConfigOutput()

  /** Project used for Artifact Registry and Cloud Run resources. */
  const project = gcp.config.project ?? clientConfig.project

  /** Artifact Registry repository created for the server image. */
  const repository = args.config.apiImageRepository
    ? undefined
    : new gcp.artifactregistry.Repository(`${args.name}-registry`, {
      description: "Limetry API serverless image",
      format: "DOCKER",
      location: args.config.location,
      repositoryId: `${args.name}-images`,
    })

  /** Artifact Registry image reference used by Cloud Run. */
  const imageRepository = args.config.apiImageRepository
    ?? pulumi.interpolate`${args.config.location}-docker.pkg.dev/${project}/${repository?.repositoryId}`

  /** Registry hostname used by the Docker image builder. */
  const registryAddress = `${args.config.location}-docker.pkg.dev`

  /** Docker registry credentials used when Artifact Registry is managed here. */
  const registries: pulumi.Input<RegistryArgs[]> | undefined = repository
    ? [{
      address: registryAddress,
      password: pulumi.secret(clientConfig.accessToken),
      username: "oauth2accesstoken",
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

  /** Cloud Run service account used by the API container. */
  const serviceAccount = new gcp.serviceaccount.Account(`${args.name}-runtime`, {
    accountId: `${args.name}-runtime`,
    displayName: "Limetry serverless runtime",
  })

  /** Optional Cloud SQL PostgreSQL connection details. */
  const database = args.config.managedDatabase
    ? createGcpDatabase(args, project, serviceAccount)
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
        image: image.ref,
        ports: { containerPort: 3810 },
        volumeMounts: database
          ? [{ mountPath: "/cloudsql", name: "cloudsql" }]
          : undefined,
      }],
      scaling: {
        maxInstanceCount: args.config.maxInstances,
        minInstanceCount: args.config.minInstances,
      },
      serviceAccount: serviceAccount.email,
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

  return {
    apiImageReference: image.ref,
    apiUrl: service.uri,
    managedDatabaseConnection: database?.connectionString,
  }
}

/**
 * Creates a low-cost Cloud SQL PostgreSQL instance for Cloud Run.
 *
 * @param args - Shared serverless deployment inputs.
 * @param project - GCP project identifier.
 * @param serviceAccount - Cloud Run runtime service account.
 * @returns Cloud SQL connection details.
 */
function createGcpDatabase(
  args: ServerlessProviderArgs,
  project: pulumi.Input<string>,
  serviceAccount: gcp.serviceaccount.Account,
): {
  connectionName: pulumi.Output<string>
  connectionString: pulumi.Output<string>
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

  /** Database password kept encrypted in Pulumi state. */
  const password = args.secrets.databasePassword

  /** Database user used by the Limetry server. */
  const _user = new gcp.sql.User(`${args.name}-database-user`, {
    instance: instance.name,
    name: args.config.databaseUsername,
    password,
    project,
  })

  /** Cloud SQL Client permission for the Cloud Run runtime. */
  const _clientRole = new gcp.projects.IAMMember(`${args.name}-database-client`, {
    member: pulumi.interpolate`serviceAccount:${serviceAccount.email}`,
    project,
    role: "roles/cloudsql.client",
  })

  /** PostgreSQL connection string using the Cloud SQL Unix socket. */
  const connectionString = pulumi.secret(pulumi.interpolate`postgresql://${args.config.databaseUsername}:${password}@/${args.config.databaseName}?host=/cloudsql/${instance.connectionName}`)

  return {
    connectionName: instance.connectionName,
    connectionString,
  }
}
