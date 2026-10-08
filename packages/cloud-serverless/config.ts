import type * as pulumi from "@pulumi/pulumi"

/** Serverless compute providers supported by this stack. */
export type ServerlessProvider = "aws" | "gcp" | "azure"

/** Supported serverless provider identifiers. */
export const SERVERLESS_PROVIDERS: ServerlessProvider[] = ["aws", "gcp", "azure"]

/** Normalized serverless deployment configuration. */
export type ServerlessConfig = {
  allowPublicDatabase: boolean
  apiImageRepository?: string
  apiImageTag: string
  apiPathPrefix: string
  cloudProvider: ServerlessProvider
  databaseName: string
  databaseUsername: string
  location: string
  managedDatabase: boolean
  maxInstances: number
  memoryMb: number
  minInstances: number
  sqliteDatabasePath: string
  timeoutSeconds: number
}

/** Environment variables passed to the Limetry server runtime. */
export type ServerEnvironment = Record<string, pulumi.Input<string>>

/**
 * Parses a serverless provider identifier.
 *
 * @param value - Raw Pulumi configuration value.
 * @returns A supported serverless provider.
 * @throws When the value is not a supported provider.
 */
export function parseServerlessProvider(value: string | undefined): ServerlessProvider {
  if (value === "aws" || value === "gcp" || value === "azure") {
    return value
  }
  if (value) {
    throw new Error(`Unsupported serverless provider "${value}". Use aws, gcp, or azure.`)
  }
  return "aws"
}

/**
 * Builds normalized serverless settings from Pulumi configuration.
 *
 * @param values - Raw serverless configuration values.
 * @returns Normalized serverless settings.
 */
export function buildServerlessConfig(values: {
  allowPublicDatabase?: boolean
  apiImageRepository?: string
  apiImageTag?: string
  apiPathPrefix?: string
  cloudProvider?: string
  databaseName?: string
  databaseUsername?: string
  location?: string
  managedDatabase?: boolean
  maxInstances?: number
  memoryMb?: number
  minInstances?: number
  sqliteDatabasePath?: string
  timeoutSeconds?: number
}): ServerlessConfig {
  const cloudProvider = parseServerlessProvider(values.cloudProvider)
  const defaults = {
    azure: { location: "westus2", memoryMb: 512 },
    aws: { location: "us-west-2", memoryMb: 1024 },
    gcp: { location: "us-central1", memoryMb: 512 },
  }[cloudProvider]
  const minInstances = values.minInstances ?? 0
  const maxInstances = values.maxInstances ?? 1
  const memoryMb = values.memoryMb ?? defaults.memoryMb
  const timeoutSeconds = values.timeoutSeconds ?? 30

  if (!Number.isInteger(minInstances) || minInstances < 0) {
    throw new Error("minInstances must be a non-negative integer")
  }
  if (!Number.isInteger(maxInstances) || maxInstances < 1 || maxInstances < minInstances) {
    throw new Error("maxInstances must be an integer greater than or equal to minInstances")
  }
  if (!Number.isInteger(memoryMb) || memoryMb < 128) {
    throw new Error("memoryMb must be an integer of at least 128")
  }
  if (!Number.isInteger(timeoutSeconds) || timeoutSeconds < 1) {
    throw new Error("timeoutSeconds must be a positive integer")
  }

  return {
    allowPublicDatabase: values.allowPublicDatabase ?? false,
    apiImageRepository: values.apiImageRepository?.trim() || undefined,
    apiImageTag: values.apiImageTag?.trim() || "latest",
    apiPathPrefix: normalizePathPrefix(values.apiPathPrefix),
    cloudProvider,
    databaseName: values.databaseName?.trim() || "limetry",
    databaseUsername: values.databaseUsername?.trim() || "limetry",
    location: values.location?.trim() || defaults.location,
    managedDatabase: values.managedDatabase ?? false,
    maxInstances,
    memoryMb,
    minInstances,
    sqliteDatabasePath: values.sqliteDatabasePath?.trim() || "/tmp/limetry.sqlite",
    timeoutSeconds,
  }
}

/**
 * Creates the server runtime environment for the selected persistence mode.
 *
 * @param config - Normalized serverless configuration.
 * @param secrets - Server secrets.
 * @returns Environment variables for the server runtime.
 */
export function buildServerEnvironment(
  config: ServerlessConfig,
  secrets: {
    bearerToken: pulumi.Input<string>
    decisionHmacSecret: pulumi.Input<string>
    jwtSecret: pulumi.Input<string>
  },
): ServerEnvironment {
  return {
    DECISION_HMAC_SECRET: secrets.decisionHmacSecret,
    JWT_SECRET: secrets.jwtSecret,
    LIMETRY_API_PATH_PREFIX: config.apiPathPrefix,
    LIMETRY_BEARER_TOKEN: secrets.bearerToken,
    LIMETRY_API_PORT: "3810",
    NODE_ENV: "serverless",
    SQLITE_DATABASE_PATH: config.sqliteDatabasePath,
    USE_POSTGRES_STORE: String(config.managedDatabase),
  }
}

/**
 * Normalizes a reverse-proxy path prefix.
 *
 * @param value - Raw path prefix.
 * @returns A slash-prefixed path without a trailing slash.
 */
function normalizePathPrefix(value: string | undefined): string {
  const trimmed = value?.trim() ?? ""
  if (trimmed.length === 0) {
    return ""
  }
  const normalized = `/${trimmed.replace(/^\/+|\/+$/g, "")}`
  if (!/^\/[\w/-]*$/.test(normalized)) {
    throw new Error("apiPathPrefix must contain only letters, numbers, underscores, hyphens, and slashes")
  }
  return normalized
}
