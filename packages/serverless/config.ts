import type * as pulumi from "@pulumi/pulumi"

/** Serverless compute providers supported by the SST stack. */
export type ServerlessProvider = "aws" | "gcp" | "azure"

/** Database providers supported by the SST stack. */
export type DatabaseProvider = "neon" | "rds" | "sqlite"

/** Normalized configuration shared by all serverless provider adapters. */
export type ServerlessConfig = {
  allowPublicDatabase: boolean
  apiCertificateId?: string
  apiDomain?: string
  apiDomainZone?: string
  apiImageRepository?: string
  apiImageTag: string
  apiPathPrefix: string
  cloudProvider: ServerlessProvider
  databaseProvider: DatabaseProvider
  databaseName: string
  databaseUsername: string
  location: string
  neonBranchName: string
  neonDatabaseName: string
  neonOrgId?: string
  neonProjectName: string
  neonRegion: string
  neonRoleName: string
  managedDatabase: boolean
  maxInstances: number
  memoryMb: number
  minInstances: number
  sqliteDatabasePath: string
  timeoutSeconds: number
}

/** Environment variables passed to the Limetry server runtime. */
export type ServerEnvironment = Record<string, pulumi.Input<string>>

/** Values accepted from SST deployment environment variables. */
export type ServerlessEnvironment = Record<string, string | undefined>

/**
 * Parses a provider name.
 *
 * @param value - Raw provider value.
 * @returns A supported provider name.
 */
export function parseServerlessProvider(value: string | undefined): ServerlessProvider {
  if (value === "aws" || value === "gcp" || value === "azure") {
    return value
  }
  if (value) {
    throw new Error(`Unsupported LIMETRY_CLOUD_PROVIDER "${value}". Use aws, gcp, or azure.`)
  }
  return "aws"
}

/**
 * Parses a database provider identifier.
 *
 * @param value - Raw database provider value.
 * @param legacyManagedDatabase - Legacy boolean database setting.
 * @returns A supported database provider.
 */
export function parseDatabaseProvider(
  value: string | undefined,
  legacyManagedDatabase?: boolean,
): DatabaseProvider {
  if (value === "neon" || value === "rds" || value === "sqlite") {
    return value
  }
  if (value) {
    throw new Error(`Unsupported LIMETRY_DATABASE_PROVIDER "${value}". Use neon, rds, or sqlite.`)
  }
  if (legacyManagedDatabase !== undefined) {
    return legacyManagedDatabase ? "neon" : "sqlite"
  }
  return "sqlite"
}

/**
 * Builds normalized deployment settings from environment variables.
 *
 * @param values - SST deployment environment values.
 * @returns Validated serverless settings.
 */
export function buildServerlessConfig(values: ServerlessEnvironment): ServerlessConfig {
  const cloudProvider = parseServerlessProvider(values.LIMETRY_CLOUD_PROVIDER)
  const legacyManagedDatabase = values.LIMETRY_MANAGED_DATABASE === undefined
    ? undefined
    : parseBoolean(values.LIMETRY_MANAGED_DATABASE, false)
  const databaseProvider = parseDatabaseProvider(values.LIMETRY_DATABASE_PROVIDER, legacyManagedDatabase)
  if (databaseProvider === "rds" && cloudProvider !== "aws") {
    throw new Error("LIMETRY_DATABASE_PROVIDER=rds requires LIMETRY_CLOUD_PROVIDER=aws")
  }
  const defaults = {
    azure: { location: "westus2", memoryMb: 512 },
    aws: { location: "us-west-2", memoryMb: 1024 },
    gcp: { location: "us-central1", memoryMb: 512 },
  }[cloudProvider]
  const minInstances = parseInteger(values.LIMETRY_MIN_INSTANCES, 0, "LIMETRY_MIN_INSTANCES")
  const maxInstances = parseInteger(values.LIMETRY_MAX_INSTANCES, 1, "LIMETRY_MAX_INSTANCES")
  const memoryMb = parseInteger(values.LIMETRY_MEMORY_MB, defaults.memoryMb, "LIMETRY_MEMORY_MB")
  const timeoutSeconds = parseInteger(values.LIMETRY_TIMEOUT_SECONDS, 30, "LIMETRY_TIMEOUT_SECONDS")

  if (maxInstances < 1 || maxInstances < minInstances) {
    throw new Error("LIMETRY_MAX_INSTANCES must be at least LIMETRY_MIN_INSTANCES and at least 1")
  }
  if (memoryMb < 128) {
    throw new Error("LIMETRY_MEMORY_MB must be at least 128")
  }
  if (timeoutSeconds < 1) {
    throw new Error("LIMETRY_TIMEOUT_SECONDS must be positive")
  }

  return {
    allowPublicDatabase: parseBoolean(values.LIMETRY_ALLOW_PUBLIC_DATABASE, false),
    apiCertificateId: values.LIMETRY_API_CERTIFICATE_ID?.trim() || undefined,
    apiDomain: normalizeDomain(values.LIMETRY_API_DOMAIN),
    apiDomainZone: values.LIMETRY_API_DOMAIN_ZONE?.trim() || undefined,
    apiImageRepository: values.LIMETRY_API_IMAGE_REPOSITORY?.trim() || undefined,
    apiImageTag: values.LIMETRY_API_IMAGE_TAG?.trim() || "latest",
    apiPathPrefix: normalizePathPrefix(values.LIMETRY_API_PATH_PREFIX),
    cloudProvider,
    databaseProvider,
    databaseName: values.LIMETRY_DATABASE_NAME?.trim() || "limetry",
    databaseUsername: values.LIMETRY_DATABASE_USERNAME?.trim() || "limetry",
    location: values.LIMETRY_LOCATION?.trim() || defaults.location,
    neonBranchName: values.LIMETRY_NEON_BRANCH_NAME?.trim() || "main",
    neonDatabaseName: values.LIMETRY_NEON_DATABASE_NAME?.trim()
      || values.LIMETRY_DATABASE_NAME?.trim()
      || "limetry",
    neonOrgId: values.LIMETRY_NEON_ORG_ID?.trim() || undefined,
    neonProjectName: values.LIMETRY_NEON_PROJECT_NAME?.trim() || "limetry-serverless",
    neonRegion: values.LIMETRY_NEON_REGION?.trim() || "aws-us-east-1",
    neonRoleName: values.LIMETRY_NEON_ROLE_NAME?.trim()
      || values.LIMETRY_DATABASE_USERNAME?.trim()
      || "limetry",
    managedDatabase: databaseProvider !== "sqlite",
    maxInstances,
    memoryMb,
    minInstances,
    sqliteDatabasePath: values.LIMETRY_SQLITE_DATABASE_PATH?.trim() || "/tmp/limetry.sqlite",
    timeoutSeconds,
  }
}

/**
 * Creates the server environment used by the API.
 *
 * @param config - Validated serverless settings.
 * @param secrets - Runtime secret values.
 * @returns Environment variables for the API.
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
    LIMETRY_API_PORT: "3810",
    LIMETRY_BEARER_TOKEN: secrets.bearerToken,
    NODE_ENV: "serverless",
    SQLITE_DATABASE_PATH: config.sqliteDatabasePath,
    USE_POSTGRES_STORE: String(config.databaseProvider !== "sqlite"),
  }
}

/**
 * Parses a boolean environment value.
 *
 * @param value - Raw boolean value.
 * @param fallback - Value used when the variable is absent.
 * @returns A parsed boolean.
 */
export function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value.trim() === "") {
    return fallback
  }
  if (value === "true") {
    return true
  }
  if (value === "false") {
    return false
  }
  throw new Error(`Expected "true" or "false", received "${value}"`)
}

/**
 * Parses a non-negative integer environment value.
 *
 * @param value - Raw integer value.
 * @param fallback - Value used when the variable is absent.
 * @param name - Environment variable name for diagnostics.
 * @returns A parsed integer.
 */
function parseInteger(value: string | undefined, fallback: number, name: string): number {
  if (value === undefined || value.trim() === "") {
    return fallback
  }
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${name} must be a non-negative integer`)
  }
  return parsed
}

/**
 * Normalizes a reverse-proxy path prefix.
 *
 * @param value - Raw path prefix.
 * @returns A slash-prefixed path without a trailing slash.
 */
function normalizePathPrefix(value: string | undefined): string {
  const trimmed = value?.trim() ?? ""
  if (!trimmed) {
    return ""
  }
  const normalized = `/${trimmed.replace(/^\/+|\/+$/g, "")}`
  if (!/^\/[\w/-]*$/.test(normalized)) {
    throw new Error("LIMETRY_API_PATH_PREFIX contains invalid characters")
  }
  return normalized
}

/**
 * Normalizes a custom API domain.
 *
 * @param value - Raw domain value.
 * @returns A hostname without a scheme or trailing slash.
 */
function normalizeDomain(value: string | undefined): string | undefined {
  const normalized = value?.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "")
  return normalized || undefined
}
