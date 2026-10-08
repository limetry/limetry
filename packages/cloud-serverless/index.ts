import { resolve } from "node:path"

import * as pulumi from "@pulumi/pulumi"
import * as random from "@pulumi/random"

import {
  assertCloudflareAuth,
  createCloudflareDnsRecords,
  resolveCloudflareZoneId,
} from "./cloudflare"
import {
  buildServerEnvironment,
  buildServerlessConfig,
} from "./config"
import { createServerlessProvider, getServerlessProviderFactory } from "./providers"
import type { ServerlessProviderArgs } from "./providers/types"

/** Pulumi configuration namespace for this stack. */
const config = new pulumi.Config()

/** Logical resource prefix used by every provider adapter. */
const name = config.get("name") ?? "limetry-serverless"

/** Normalized serverless deployment configuration. */
const serverlessConfig = buildServerlessConfig({
  allowPublicDatabase: config.getBoolean("allowPublicDatabase"),
  apiImageRepository: config.get("apiImageRepository"),
  apiImageTag: config.get("apiImageTag"),
  apiDomain: config.get("apiDomain"),
  apiDomainZone: config.get("apiDomainZone"),
  cloudflareZoneId: config.get("cloudflareZoneId"),
  manageCloudflare: config.getBoolean("manageCloudflare"),
  apiPathPrefix: config.get("apiPathPrefix"),
  cloudProvider: config.get("cloudProvider"),
  databaseName: config.get("databaseName"),
  databaseUsername: config.get("databaseUsername"),
  databaseProvider: config.get("databaseProvider"),
  location: config.get("location"),
  neonBranchName: config.get("neonBranchName"),
  neonDatabaseName: config.get("neonDatabaseName"),
  neonOrgId: config.get("neonOrgId"),
  neonProjectName: config.get("neonProjectName"),
  neonRegion: config.get("neonRegion"),
  neonRoleName: config.get("neonRoleName"),
  managedDatabase: config.getBoolean("managedDatabase"),
  maxInstances: config.getNumber("maxInstances"),
  memoryMb: config.getNumber("memoryMb"),
  minInstances: config.getNumber("minInstances"),
  sqliteDatabasePath: config.get("sqliteDatabasePath"),
  timeoutSeconds: config.getNumber("timeoutSeconds"),
})

/** Repository root used for Lambda bundling and container image builds. */
const repoRoot = resolve(process.cwd(), "../..")

/**
 * Resolves a configured secret or creates a stable encrypted Pulumi secret.
 *
 * @param key - Pulumi configuration key.
 * @param length - Generated secret length.
 * @returns Secret output used by the server runtime.
 */
function resolveSecret(key: string, length: number): pulumi.Output<string> {
  const configured = config.getSecret(key)
  if (configured) {
    return configured
  }

  const generated = new random.RandomPassword(`${name}-${key}`, {
    length,
    special: false,
  })
  return generated.result
}

/** Bearer token used by the API's machine-to-machine authentication middleware. */
const bearerToken = resolveSecret("bearerToken", 48)

/** JWT signing secret used by the API token endpoints. */
const jwtSecret = resolveSecret("jwtSecret", 64)

/** HMAC secret used to sign and verify policy decision receipts. */
const decisionHmacSecret = resolveSecret("decisionHmacSecret", 64)

/** Database password created only when managed PostgreSQL is enabled. */
const databasePassword = serverlessConfig.databaseProvider === "rds"
  ? resolveSecret("databasePassword", 40)
  : pulumi.secret("")
const neonApiKey = config.getSecret("neonApiKey")
  ?? (process.env.LIMETRY_NEON_API_KEY ? pulumi.secret(process.env.LIMETRY_NEON_API_KEY) : undefined)

/** Environment variables shared by all serverless provider adapters. */
const environment = buildServerEnvironment(serverlessConfig, {
  bearerToken,
  decisionHmacSecret,
  jwtSecret,
})

/** Inputs passed to the selected serverless provider adapter. */
const providerArgs: ServerlessProviderArgs = {
  config: serverlessConfig,
  environment,
  name,
  repoRoot,
  createDnsRecords: serverlessConfig.manageCloudflare && serverlessConfig.apiDomain
    ? (resourcePrefix, records) => createCloudflareDnsRecords(
      `${name}-${resourcePrefix}`,
      resolveCloudflareZoneId(serverlessConfig.apiDomainZone, config.get("cloudflareZoneId")),
      records,
    )
    : undefined,
  secrets: {
    bearerToken,
    databasePassword,
    decisionHmacSecret,
    jwtSecret,
    neonApiKey,
  },
}

if (serverlessConfig.apiDomain && serverlessConfig.manageCloudflare) {
  assertCloudflareAuth()
}

/** Provider-specific serverless resources. */
const provider = createServerlessProvider(
  getServerlessProviderFactory(serverlessConfig.cloudProvider),
  providerArgs,
)

/** Public URL for the deployed Limetry API. */
export const apiUrl = provider.apiUrl

/** Lambda bundle or container image reference used by the deployment. */
export const apiImageReference = provider.apiImageReference

/** Selected compute provider. */
export const cloudProvider = serverlessConfig.cloudProvider

/** Whether the deployment uses a managed PostgreSQL database. */
export const databaseMode = serverlessConfig.databaseProvider

/** Managed database connection string, hidden unless Pulumi shows secrets. */
export const databaseConnection = provider.managedDatabaseConnection ?? pulumi.secret("")
