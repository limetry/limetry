/**
 * Cloud-agnostic Limetry self-host stack.
 *
 * Kubernetes is the portability boundary: the same stack runs on a local
 * cluster, managed Kubernetes, or a Kubernetes-compatible private cloud.
 * The marketing website is intentionally outside this package.
 */

import * as k8s from "@pulumi/kubernetes"
import * as pulumi from "@pulumi/pulumi"

const config = new pulumi.Config()
const name = config.get("name") ?? "limetry"
const namespaceName = config.get("namespace") ?? name
const apiImage = config.get("apiImage") ?? "limetry-server:local"
const apiPort = config.getNumber("apiPort") ?? 3810
const storageSize = config.get("storageSize") ?? "1Gi"
const usePostgres = config.getBoolean("usePostgres") ?? false
const bearerToken = config.requireSecret("bearerToken")
const jwtSecret = config.requireSecret("jwtSecret")
const decisionHmacSecret = config.getSecret("decisionHmacSecret") ?? jwtSecret
const databaseUrl = usePostgres ? config.requireSecret("databaseUrl") : undefined

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

const sqliteVolume = new k8s.core.v1.PersistentVolumeClaim(`${name}-sqlite`, {
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
          image: apiImage,
          imagePullPolicy: "IfNotPresent",
          ports: [{ name: "http", containerPort: apiPort }],
          env: [
            { name: "NODE_ENV", value: "production" },
            { name: "LIMETRY_API_PORT", value: String(apiPort) },
            { name: "USE_POSTGRES_STORE", value: String(usePostgres) },
            { name: "SQLITE_DATABASE_PATH", value: "/data/limetry.sqlite" },
            { name: "LIMETRY_BEARER_TOKEN", valueFrom: { secretKeyRef: { name: runtimeSecret.metadata.name, key: "LIMETRY_BEARER_TOKEN" } } },
            { name: "JWT_SECRET", valueFrom: { secretKeyRef: { name: runtimeSecret.metadata.name, key: "JWT_SECRET" } } },
            { name: "DECISION_HMAC_SECRET", valueFrom: { secretKeyRef: { name: runtimeSecret.metadata.name, key: "DECISION_HMAC_SECRET" } } },
            ...(databaseUrl ? [{ name: "DATABASE_URL", valueFrom: { secretKeyRef: { name: runtimeSecret.metadata.name, key: "DATABASE_URL" } } }] : []),
          ],
          volumeMounts: [{ name: "sqlite", mountPath: "/data" }],
          readinessProbe: { httpGet: { path: "/health", port: "http" }, initialDelaySeconds: 3 },
          livenessProbe: { httpGet: { path: "/health", port: "http" }, initialDelaySeconds: 10 },
        }],
        volumes: [{ name: "sqlite", persistentVolumeClaim: { claimName: sqliteVolume.metadata.name } }],
      },
    },
  },
}, { dependsOn: [runtimeSecret, sqliteVolume] })

const apiService = new k8s.core.v1.Service(`${name}-api`, {
  metadata: { namespace: namespace.metadata.name },
  spec: {
    selector: labels,
    ports: [{ name: "http", port: 80, targetPort: "http" }],
    type: config.get("serviceType") ?? "ClusterIP",
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

export const apiServiceName = apiService.metadata.name
export const apiNamespace = namespace.metadata.name
export const apiEndpoint = pulumi.interpolate`http://${apiService.metadata.name}.${namespace.metadata.name}.svc.cluster.local`
export const persistence = usePostgres ? "postgres" : "sqlite"
