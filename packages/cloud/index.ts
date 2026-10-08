/**
 * Cloud-agnostic Limetry self-host stack.
 *
 * Kubernetes is the portability boundary: the same stack runs on a local
 * cluster, managed Kubernetes, or a Kubernetes-compatible private cloud.
 * The marketing website is intentionally outside this package.
 */

import { join, resolve } from "node:path"

import * as dockerbuild from "@pulumi/docker-build"
import * as k8s from "@pulumi/kubernetes"
import * as pulumi from "@pulumi/pulumi"
import * as random from "@pulumi/random"

import {
  assertCloudflareAuth,
  createCloudflareApiRecord,
  resolveCloudflareZoneId,
} from "./cloudflare"
import {
  API_PORT,
  buildApiDnsAnnotations,
  buildApiDocumentationUrls,
  buildApiUrl,
  buildCloudProviderConfig,
  buildSecretResourceName,
  resolvePersistence,
} from "./config"
import { createNeonDatabase } from "./neon"
import { createCloudProvider } from "./providers"

/** Pulumi configuration namespace for this stack. */
const config = new pulumi.Config()

/** Logical name used as the Kubernetes resource prefix. */
const name = config.get("name") ?? "limetry"

/** Kubernetes namespace containing the Limetry API resources. */
const namespaceName = config.get("namespace") ?? name

/** Persistent-volume size used by the default SQLite store. */
const storageSize = config.get("storageSize") ?? "1Gi"

/** Optional existing image repository used when registry creation is disabled. */
const configuredImageRepository = config.get("registryRepository") ?? config.get("apiImageRepository")

/** Selects and provisions the configured cloud Kubernetes provider. */
const cloudProviderConfig = buildCloudProviderConfig({
  apiDomain: config.get("apiDomain"),
  apiDomainZone: config.get("apiDomainZone"),
  cloudflareZoneId: config.get("cloudflareZoneId"),
  manageCloudflare: config.getBoolean("manageCloudflare"),
  cloudProvider: config.get("cloudProvider"),
  createCluster: config.getBoolean("createCluster"),
  createRegistry: config.getBoolean("createRegistry"),
  clusterName: config.get("clusterName"),
  databaseAllowedCidr: config.get("databaseAllowedCidr"),
  databaseName: config.get("databaseName"),
  databaseProvider: config.get("databaseProvider"),
  databaseUsername: config.get("databaseUsername"),
  location: config.get("location"),
  kubeconfig: config.getSecret("kubeconfig"),
  neonApiKey: config.getSecret("neonApiKey")
    ?? (process.env.NEON_API_KEY ? pulumi.secret(process.env.NEON_API_KEY) : undefined),
  neonBranchName: config.get("neonBranchName"),
  neonDatabaseName: config.get("neonDatabaseName"),
  neonOrgId: config.get("neonOrgId"),
  neonProjectName: config.get("neonProjectName"),
  neonRegion: config.get("neonRegion"),
  neonRoleName: config.get("neonRoleName"),
  nodeCount: config.getNumber("nodeCount"),
  nodeMachineType: config.get("nodeMachineType"),
  resourceGroupName: config.get("resourceGroupName"),
  registryRepository: configuredImageRepository,
  usePostgres: config.getBoolean("usePostgres"),
})

/** Selected cloud adapter supplying Kubernetes and registry resources. */
const cloudProvider = createCloudProvider(name, cloudProviderConfig)
const neonDatabase = cloudProviderConfig.databaseProvider === "neon"
  ? createNeonDatabase(name, cloudProviderConfig)
  : undefined
const databaseUrl = cloudProvider.databaseUrl ?? neonDatabase?.connectionString

/**
 * Configured public hostname for the API, without a URL scheme or trailing slash.
 */
export const apiDomain = cloudProviderConfig.apiDomain

/**
 * DNS zone associated with the configured API hostname.
 */
export const apiDomainZone = cloudProviderConfig.apiDomainZone

if (cloudProviderConfig.apiDomain && cloudProviderConfig.manageCloudflare) {
  assertCloudflareAuth()
}

/** Image reference shared by the build resource and API Deployment. */
const imageTag = pulumi.interpolate`${cloudProvider.imageRepository}:${config.get("apiImageTag") ?? `pulumi-${pulumi.getStack()}`}`

/** Whether the image builder should push to a registry instead of loading locally. */
const shouldPushImage = Boolean(cloudProvider.registries) || Boolean(configuredImageRepository)

/** Repository root used as the Docker build context. */
const repoRoot = resolve(process.cwd(), "../..")

/**
 * Resolves an explicitly configured secret or creates a stable Pulumi-managed
 * password resource when the config value is absent.
 *
 * @param namePart - Pulumi config key and logical secret name.
 * @param length - Number of characters for a generated secret.
 * @returns A secret value suitable for a Kubernetes Secret.
 */
function resolveSecret(namePart: string, length: number): pulumi.Output<string> {
  const configured = config.getSecret(namePart)
  if (configured) {
    return configured
  }

  /** Pulumi-managed password resource used when no secret is configured. */
  const generated = new random.RandomPassword(buildSecretResourceName(name, namePart), {
    length,
    special: false,
  })
  return generated.result
}

/** Bearer token used by the API's machine-to-machine authentication middleware. */
export const bearerToken = pulumi.secret(resolveSecret("bearerToken", 48))

/** JWT signing secret used by the API's token endpoints. */
export const jwtSecret = pulumi.secret(resolveSecret("jwtSecret", 64))

/** HMAC secret used to sign and verify policy decision receipts. */
export const decisionHmacSecret = pulumi.secret(resolveSecret("decisionHmacSecret", 64))

/** Builds and optionally pushes the OSS API image for the target stack. */
const apiImage = new dockerbuild.Image(`${name}-api-image`, {
  buildOnPreview: false,
  context: { location: repoRoot },
  dockerfile: { location: join(repoRoot, "packages/server/Dockerfile") },
  load: !shouldPushImage,
  platforms: ["linux/amd64"],
  push: shouldPushImage,
  registries: cloudProvider.registries,
  tags: [imageTag],
})

/** Creates the namespace shared by all stack resources. */
const namespace = new k8s.core.v1.Namespace(`${name}-namespace`, {
  metadata: { name: namespaceName },
}, { provider: cloudProvider.kubernetesProvider })

/** Stores API credentials and the optional Postgres connection string. */
const runtimeSecret = new k8s.core.v1.Secret(`${name}-runtime`, {
  metadata: { namespace: namespace.metadata.name },
  stringData: {
    LIMETRY_BEARER_TOKEN: bearerToken,
    JWT_SECRET: jwtSecret,
    DECISION_HMAC_SECRET: decisionHmacSecret,
    ...(databaseUrl ? { DATABASE_URL: databaseUrl } : {}),
  },
  type: "Opaque",
}, { provider: cloudProvider.kubernetesProvider })

/** Durable SQLite volume, omitted when the API uses Postgres. */
const sqliteVolume = cloudProviderConfig.databaseProvider === "sqlite"
  ? new k8s.core.v1.PersistentVolumeClaim(`${name}-sqlite`, {
    metadata: { namespace: namespace.metadata.name },
    spec: {
      accessModes: ["ReadWriteOnce"],
      resources: { requests: { storage: storageSize } },
    },
  }, { provider: cloudProvider.kubernetesProvider })
  : undefined

/** Common labels used to connect the Deployment and Service. */
const labels = { "app.kubernetes.io/name": name, "app.kubernetes.io/component": "evaluate-api" }

/**
 * Runs the API with one replica for SQLite or the configured replica count for
 * Postgres, mounting durable SQLite storage only when required.
 */
const apiDeployment = new k8s.apps.v1.Deployment(`${name}-api`, {
  metadata: { namespace: namespace.metadata.name },
  spec: {
    replicas: cloudProviderConfig.databaseProvider === "sqlite" ? 1 : config.getNumber("replicas") ?? 2,
    selector: { matchLabels: labels },
    template: {
      metadata: { labels },
      spec: {
        containers: [{
          name: "api",
          image: imageTag,
          imagePullPolicy: "IfNotPresent",
          ports: [{ name: "http", containerPort: API_PORT }],
          env: [
            { name: "NODE_ENV", value: "production" },
            { name: "LIMETRY_API_PORT", value: String(API_PORT) },
            { name: "USE_POSTGRES_STORE", value: String(cloudProviderConfig.databaseProvider !== "sqlite") },
            { name: "SQLITE_DATABASE_PATH", value: "/data/limetry.sqlite" },
            { name: "LIMETRY_BEARER_TOKEN", valueFrom: { secretKeyRef: { name: runtimeSecret.metadata.name, key: "LIMETRY_BEARER_TOKEN" } } },
            { name: "JWT_SECRET", valueFrom: { secretKeyRef: { name: runtimeSecret.metadata.name, key: "JWT_SECRET" } } },
            { name: "DECISION_HMAC_SECRET", valueFrom: { secretKeyRef: { name: runtimeSecret.metadata.name, key: "DECISION_HMAC_SECRET" } } },
            ...(databaseUrl ? [{ name: "DATABASE_URL", valueFrom: { secretKeyRef: { name: runtimeSecret.metadata.name, key: "DATABASE_URL" } } }] : []),
          ],
          volumeMounts: sqliteVolume
            ? [{ name: "sqlite", mountPath: "/data" }]
            : undefined,
          readinessProbe: { httpGet: { path: "/health", port: "http" }, initialDelaySeconds: 3 },
          livenessProbe: { httpGet: { path: "/health", port: "http" }, initialDelaySeconds: 10 },
        }],
        volumes: sqliteVolume
          ? [{ name: "sqlite", persistentVolumeClaim: { claimName: sqliteVolume.metadata.name } }]
          : undefined,
      },
    },
  },
}, {
  provider: cloudProvider.kubernetesProvider,
  dependsOn: [
    runtimeSecret,
    ...(sqliteVolume ? [sqliteVolume] : []),
    apiImage,
  ],
})

/** Public HTTP Service for the API, defaulting to a provider LoadBalancer. */
const apiService = new k8s.core.v1.Service(`${name}-api`, {
  metadata: {
    namespace: namespace.metadata.name,
    annotations: apiDomain && !cloudProviderConfig.manageCloudflare
      ? buildApiDnsAnnotations(apiDomain, apiDomainZone)
      : {},
  },
  spec: {
    selector: labels,
    ports: [{ name: "http", port: 80, targetPort: "http" }],
    type: config.get("serviceType") ?? "LoadBalancer",
  },
}, { dependsOn: [apiDeployment], provider: cloudProvider.kubernetesProvider })

/** Kubernetes Service name for the public API. */
export const apiServiceName = apiService.metadata.name

/** Kubernetes namespace containing the API resources. */
export const apiNamespace = namespace.metadata.name

/** Internal cluster URL for callers running inside the Kubernetes network. */
export const apiEndpoint = pulumi.interpolate`http://${apiService.metadata.name}.${namespace.metadata.name}.svc.cluster.local`

/**
 * Provider-assigned load-balancer hostname or IP address.
 *
 * It remains unknown until the Kubernetes Service receives an ingress address.
 */
export const apiServiceAddress = apiService.status.apply((status) => {
  const ingress = status?.loadBalancer?.ingress?.[0]
  return ingress?.hostname ?? ingress?.ip
})

/** Cloudflare DNS-only record for the configured API hostname. */
export const apiDnsRecordFqdn = apiDomain && cloudProviderConfig.manageCloudflare
  ? createCloudflareApiRecord(
    `${name}-api-dns`,
    resolveCloudflareZoneId(apiDomainZone, cloudProviderConfig.cloudflareZoneId),
    apiDomain,
    apiServiceAddress,
  )
  : pulumi.output<string | undefined>(undefined)

/**
 * Public API origin, using configured HTTPS DNS or the provider's HTTP
 * load-balancer address when no hostname is configured.
 */
export const apiUrl = apiServiceAddress.apply((serviceAddress) =>
  buildApiUrl(apiDomain, serviceAddress),
)

/** Derived documentation links for the configured or assigned API origin. */
const apiDocumentationUrls = apiUrl.apply(buildApiDocumentationUrls)

/** Public URL for the versioned OpenAPI JSON document. */
export const apiOpenApiJsonUrl = apiDocumentationUrls.apply((urls) => urls?.openApiJson)

/** Public URL for the versioned OpenAPI YAML document. */
export const apiOpenApiYamlUrl = apiDocumentationUrls.apply((urls) => urls?.openApiYaml)

/** Public URL for the versioned Swagger UI. */
export const apiDocsUrl = apiDocumentationUrls.apply((urls) => urls?.docs)

/** Docker image reference deployed by the API Deployment. */
export const apiImageReference = imageTag

/** Database provider selected by stack configuration. */
export const databaseProvider = cloudProviderConfig.databaseProvider

/** Persistence backend selected by database provider configuration. */
export const persistence = resolvePersistence(cloudProviderConfig.databaseProvider)

/** Neon project name when the Neon provider is selected. */
export const neonProjectName = neonDatabase?.projectName ?? pulumi.output("")
