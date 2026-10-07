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
  API_PORT,
  buildApiDnsAnnotations,
  buildApiDocumentationUrls,
  buildApiImageTag,
  buildApiUrl,
  buildSecretResourceName,
  normalizeApiDomain,
  resolvePersistence,
} from "./config"

const config = new pulumi.Config()
const name = config.get("name") ?? "limetry"
const namespaceName = config.get("namespace") ?? name
const storageSize = config.get("storageSize") ?? "1Gi"
const usePostgres = config.getBoolean("usePostgres") ?? false

/**
 * Configured public hostname for the API, without a URL scheme or trailing slash.
 */
export const apiDomain = normalizeApiDomain(config.get("apiDomain"))

/**
 * DNS zone associated with the configured API hostname.
 */
export const apiDomainZone = config.get("apiDomainZone") ?? "limetry.org"
const imageRepository = config.get("apiImageRepository")?.trim() || undefined
const imageTag = buildApiImageTag(name, pulumi.getStack(), imageRepository, config.get("apiImageTag"))
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
const databaseUrl = usePostgres ? config.requireSecret("databaseUrl") : undefined

const apiImage = new dockerbuild.Image(`${name}-api-image`, {
  buildOnPreview: false,
  context: { location: repoRoot },
  dockerfile: { location: join(repoRoot, "packages/server/Dockerfile") },
  load: !imageRepository,
  platforms: ["linux/amd64"],
  push: Boolean(imageRepository),
  tags: [imageTag],
})

const namespace = new k8s.core.v1.Namespace(`${name}-namespace`, {
  metadata: { name: namespaceName },
})

const runtimeSecret = new k8s.core.v1.Secret(`${name}-runtime`, {
  metadata: { namespace: namespace.metadata.name },
  stringData: {
    LIMETRY_BEARER_TOKEN: bearerToken,
    JWT_SECRET: jwtSecret,
    DECISION_HMAC_SECRET: decisionHmacSecret,
    ...(databaseUrl ? { DATABASE_URL: databaseUrl } : {}),
  },
  type: "Opaque",
})

const sqliteVolume = usePostgres
  ? undefined
  : new k8s.core.v1.PersistentVolumeClaim(`${name}-sqlite`, {
    metadata: { namespace: namespace.metadata.name },
    spec: {
      accessModes: ["ReadWriteOnce"],
      resources: { requests: { storage: storageSize } },
    },
  })

const labels = { "app.kubernetes.io/name": name, "app.kubernetes.io/component": "evaluate-api" }

const apiDeployment = new k8s.apps.v1.Deployment(`${name}-api`, {
  metadata: { namespace: namespace.metadata.name },
  spec: {
    replicas: usePostgres ? config.getNumber("replicas") ?? 2 : 1,
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
            { name: "USE_POSTGRES_STORE", value: String(usePostgres) },
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
  dependsOn: [
    runtimeSecret,
    ...(sqliteVolume ? [sqliteVolume] : []),
    apiImage,
  ],
})

const apiService = new k8s.core.v1.Service(`${name}-api`, {
  metadata: {
    namespace: namespace.metadata.name,
    annotations: buildApiDnsAnnotations(apiDomain, apiDomainZone),
  },
  spec: {
    selector: labels,
    ports: [{ name: "http", port: 80, targetPort: "http" }],
    type: config.get("serviceType") ?? "LoadBalancer",
  },
}, { dependsOn: [apiDeployment] })

const postgresServiceName = `${name}-postgres`
if (usePostgres && databaseUrl) {
  const postgresPassword = config.requireSecret("postgresPassword")
  const postgresSecret = new k8s.core.v1.Secret(`${name}-postgres`, {
    metadata: { namespace: namespace.metadata.name },
    stringData: { POSTGRES_PASSWORD: postgresPassword },
    type: "Opaque",
  })
  const postgresLabels = { "app.kubernetes.io/name": name, "app.kubernetes.io/component": "postgres" }
  const postgres = new k8s.apps.v1.StatefulSet(`${name}-postgres`, {
    metadata: { namespace: namespace.metadata.name },
    spec: {
      serviceName: postgresServiceName,
      replicas: 1,
      selector: { matchLabels: postgresLabels },
      template: {
        metadata: { labels: postgresLabels },
        spec: {
          containers: [{
            name: "postgres",
            image: config.get("postgresImage") ?? "postgres:16",
            ports: [{ name: "postgres", containerPort: 5432 }],
            env: [
              { name: "POSTGRES_USER", value: "limetry" },
              { name: "POSTGRES_DB", value: "limetry" },
              { name: "POSTGRES_PASSWORD", valueFrom: { secretKeyRef: { name: postgresSecret.metadata.name, key: "POSTGRES_PASSWORD" } } },
            ],
            volumeMounts: [{ name: "postgres-data", mountPath: "/var/lib/postgresql/data" }],
          }],
        },
      },
      volumeClaimTemplates: [{
        metadata: { name: "postgres-data" },
        spec: {
          accessModes: ["ReadWriteOnce"],
          resources: { requests: { storage: config.get("postgresStorageSize") ?? "10Gi" } },
        },
      }],
    },
  }, { dependsOn: [postgresSecret] })
  new k8s.core.v1.Service(postgresServiceName, {
    metadata: { namespace: namespace.metadata.name },
    spec: { selector: postgresLabels, ports: [{ name: "postgres", port: 5432 }] },
  }, { dependsOn: [postgres] })
}

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

/**
 * Public API origin, using configured HTTPS DNS or the provider's HTTP
 * load-balancer address when no hostname is configured.
 */
export const apiUrl = apiServiceAddress.apply((serviceAddress) =>
  buildApiUrl(apiDomain, serviceAddress),
)
const apiDocumentationUrls = apiUrl.apply(buildApiDocumentationUrls)

/** Public URL for the versioned OpenAPI JSON document. */
export const apiOpenApiJsonUrl = apiDocumentationUrls.apply((urls) => urls?.openApiJson)

/** Public URL for the versioned OpenAPI YAML document. */
export const apiOpenApiYamlUrl = apiDocumentationUrls.apply((urls) => urls?.openApiYaml)

/** Public URL for the versioned Swagger UI. */
export const apiDocsUrl = apiDocumentationUrls.apply((urls) => urls?.docs)

/** Docker image reference deployed by the API Deployment. */
export const apiImageReference = imageTag

/** Persistence backend selected by `usePostgres`. */
export const persistence = resolvePersistence(usePostgres)
