import type * as pulumi from "@pulumi/pulumi"

/** Serverless compute providers supported by this stack. */
export type ServerlessProvider = "aws" | "gcp" | "azure"

/** Supported serverless provider identifiers. */
export const SERVERLESS_PROVIDERS: ServerlessProvider[] = ["aws", "gcp", "azure"]

/** Database providers supported by this stack. */
export type DatabaseProvider = "neon" | "rds" | "sqlite"

/** Supported database provider identifiers. */
export const DATABASE_PROVIDERS: DatabaseProvider[] = ["neon", "rds", "sqlite"]

/** DNS management backends when `manageDns` is true. */
export type DnsProvider = "native" | "cloudflare"

/** Supported DNS provider identifiers. */
export const DNS_PROVIDERS: DnsProvider[] = ["native", "cloudflare"]

/** Normalized serverless deployment configuration. */
export type ServerlessConfig = {
  allowPublicDatabase: boolean
  apiImageRepository?: string
  apiImageTag: string
  apiDomain?: string
  apiDomainZone: string
  /** AWS Route 53 hosted zone id (`Z…`) when lookup by `apiDomainZone` is not used. */
  apiHostedZoneId?: string
  cloudflareZoneId?: string
  manageDns: boolean
  dnsProvider: DnsProvider
  dnsResourceGroupName?: string
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
    throw new Error(`Unsupported databaseProvider "${value}". Use neon, rds, or sqlite.`)
  }
  if (legacyManagedDatabase !== undefined) {
    return legacyManagedDatabase ? "neon" : "sqlite"
  }
  return "neon"
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
  apiDomain?: string
  apiDomainZone?: string
  apiHostedZoneId?: string
  cloudflareZoneId?: string
  dnsProvider?: string
  manageDns?: boolean
  manageCloudflare?: boolean
  dnsResourceGroupName?: string
  apiPathPrefix?: string
  cloudProvider?: string
  databaseProvider?: string
  databaseName?: string
  databaseUsername?: string
  location?: string
  neonBranchName?: string
  neonDatabaseName?: string
  neonOrgId?: string
  neonProjectName?: string
  neonRegion?: string
  neonRoleName?: string
  managedDatabase?: boolean
  maxInstances?: number
  memoryMb?: number
  minInstances?: number
  sqliteDatabasePath?: string
  timeoutSeconds?: number
}): ServerlessConfig {
  const cloudProvider = parseServerlessProvider(values.cloudProvider)
  const databaseProvider = parseDatabaseProvider(values.databaseProvider, values.managedDatabase)
  if (databaseProvider === "rds" && cloudProvider !== "aws") {
    throw new Error("databaseProvider=rds requires cloudProvider=aws")
  }
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

  const apiDomain = normalizeApiDomain(values.apiDomain)
  const manageDns = values.manageDns ?? Boolean(apiDomain)
  const dnsProvider = parseDnsProvider(
    values.dnsProvider,
    values.manageCloudflare,
    manageDns,
  )

  return {
    allowPublicDatabase: values.allowPublicDatabase ?? false,
    apiImageRepository: values.apiImageRepository?.trim() || undefined,
    apiImageTag: values.apiImageTag?.trim() || "latest",
    apiDomain,
    apiDomainZone: values.apiDomainZone?.trim() || inferDnsZone(values.apiDomain),
    apiHostedZoneId: normalizeAwsHostedZoneId(values.apiHostedZoneId),
    cloudflareZoneId: values.cloudflareZoneId?.trim() || undefined,
    manageDns,
    dnsProvider,
    dnsResourceGroupName: values.dnsResourceGroupName?.trim() || undefined,
    apiPathPrefix: normalizePathPrefix(values.apiPathPrefix),
    cloudProvider,
    databaseProvider,
    databaseName: values.databaseName?.trim() || "limetry",
    databaseUsername: values.databaseUsername?.trim() || "limetry",
    location: values.location?.trim() || defaults.location,
    neonBranchName: values.neonBranchName?.trim() || "main",
    neonDatabaseName: values.neonDatabaseName?.trim() || values.databaseName?.trim() || "limetry",
    neonOrgId: values.neonOrgId?.trim() || undefined,
    neonProjectName: values.neonProjectName?.trim() || "limetry-serverless",
    neonRegion: values.neonRegion?.trim() || "aws-us-east-1",
    neonRoleName: values.neonRoleName?.trim() || values.databaseUsername?.trim() || "limetry",
    managedDatabase: databaseProvider !== "sqlite",
    maxInstances,
    memoryMb,
    minInstances,
    sqliteDatabasePath: values.sqliteDatabasePath?.trim() || "/tmp/limetry.sqlite",
    timeoutSeconds,
  }
}

/**
 * Normalizes a configured public API hostname.
 *
 * @param value - Hostname or HTTPS URL from Pulumi config.
 * @returns Hostname without scheme or trailing slash.
 */
function normalizeApiDomain(value: string | undefined): string | undefined {
  const trimmed = value?.trim() ?? ""
  if (trimmed.length === 0) {
    return undefined
  }

  if (trimmed.includes("/") && !/^https?:\/\//i.test(trimmed)) {
    throw new Error("apiDomain must be a valid DNS hostname, not a URL path")
  }
  if (/^https?:\/\//i.test(trimmed)) {
    const parsed = new URL(trimmed)
    if (parsed.pathname !== "/" || parsed.search || parsed.hash) {
      throw new Error("apiDomain must be a valid DNS hostname, not a URL path")
    }
  }
  const normalized = trimmed
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "")
  if (!/^(?=.{1,253}$)(?!-)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(normalized)) {
    throw new Error("apiDomain must be a valid DNS hostname, not a URL path or apex without a TLD")
  }
  return normalized.toLowerCase()
}

/**
 * Parses the DNS management backend for custom domains.
 *
 * @param value - Raw dnsProvider value.
 * @param legacyManageCloudflare - Deprecated manageCloudflare flag.
 * @param manageDns - Whether DNS is managed by the stack.
 * @param cloudProvider - Selected compute provider.
 * @returns Native or Cloudflare DNS management.
 */
export function parseDnsProvider(
  value: string | undefined,
  legacyManageCloudflare: boolean | undefined,
  manageDns: boolean,
): DnsProvider {
  if (!manageDns) {
    return "native"
  }
  if (value === "cloudflare" || legacyManageCloudflare === true) {
    return "cloudflare"
  }
  if (value === "native" || !value) {
    return "native"
  }
  throw new Error(`Unsupported dnsProvider "${value}". Use native or cloudflare.`)
}

/**
 * Normalizes an AWS Route 53 hosted zone id.
 *
 * @param value - Raw zone id from Pulumi config.
 * @returns Zone id or undefined when omitted.
 */
function normalizeAwsHostedZoneId(value: string | undefined): string | undefined {
  const trimmed = value?.trim() ?? ""
  if (trimmed.length === 0) {
    return undefined
  }
  if (!/^Z[A-Z0-9]+$/i.test(trimmed)) {
    throw new Error("apiHostedZoneId must be an AWS Route 53 hosted zone id (for example Z1234567890ABC)")
  }
  return trimmed.toUpperCase()
}

/**
 * Infers the DNS zone from a public hostname.
 *
 * @param value - Configured API hostname.
 * @returns Inferred zone apex or the production default.
 */
function inferDnsZone(value: string | undefined): string {
  const hostname = normalizeApiDomain(value)
  if (!hostname) {
    return "limetry.org"
  }
  return hostname.split(".").slice(-2).join(".")
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
    USE_POSTGRES_STORE: String(config.databaseProvider !== "sqlite"),
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
