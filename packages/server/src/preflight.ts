/**
 * OSS startup preflight for `\@limetry/server` using `\@limetry/preflight`.
 *
 * Collects env checks, connectivity probes (Postgres/Redis/telemetry), and
 * configuration lines before the Express app accepts traffic.
 */

import {
  annotated,
  collectConfiguredTelemetry,
  createPostgresProbe,
  createRedisProbe,
  envCheck,
  formatPreflightReport,
  listEffectiveDotenvFiles,
  maskSecret,
  type PreflightCheck,
  redactDatabaseUrl,
  resolvePublicListenUrl,
  runPreflight,
} from "@limetry/preflight"
import { APP_VERSION } from "@limetry/sdk"

import type { ServerEnv } from "./env.js"

export {
  formatPreflightReport,
  listEffectiveDotenvFiles,
  maskSecret,
  type PreflightCheck,
  redactDatabaseUrl,
}

/**
 * Returns whether `NODE_ENV` is exactly `"production"`.
 *
 * @param nodeEnv - Value of `NODE_ENV`.
 * @returns `true` in production.
 */
function isProduction(nodeEnv: string | undefined): boolean {
  return nodeEnv === "production"
}

/**
 * Builds env-status checks for bearer/JWT/HMAC secrets and store URLs.
 *
 * In production, `DECISION_HMAC_SECRET` and `USE_POSTGRES_STORE` are required;
 * `DATABASE_URL` is required when Postgres store is enabled. Redis is optional.
 *
 * @param env - Validated server environment.
 * @param nodeEnv - `NODE_ENV` used for required/ok thresholds.
 * @returns Preflight check rows for the report.
 */
export function collectOssEnvChecks(env: ServerEnv, nodeEnv = process.env.NODE_ENV): PreflightCheck[] {
  const database = redactDatabaseUrl(env.DATABASE_URL)
  return [
    envCheck({
      name: "LIMETRY_BEARER_TOKEN",
      value: env.LIMETRY_BEARER_TOKEN,
      secret: true,
      ok: env.LIMETRY_BEARER_TOKEN.length >= 16,
      required: true,
    }),
    envCheck({
      name: "JWT_SECRET",
      value: env.JWT_SECRET,
      secret: true,
      ok: env.JWT_SECRET.length >= 32,
      required: true,
    }),
    envCheck({
      name: "DECISION_HMAC_SECRET",
      value: env.DECISION_HMAC_SECRET,
      secret: true,
      ok: Boolean(env.DECISION_HMAC_SECRET) || !isProduction(nodeEnv),
      required: isProduction(nodeEnv),
    }),
    envCheck({
      name: "USE_POSTGRES_STORE",
      display: env.USE_POSTGRES_STORE ? "true" : "false",
      ok: env.USE_POSTGRES_STORE || Boolean(env.SQLITE_DATABASE_PATH),
      required: isProduction(nodeEnv),
    }),
    envCheck({
      name: "DATABASE_URL",
      display: database.display,
      ok: Boolean(env.DATABASE_URL),
      required: env.USE_POSTGRES_STORE,
    }),
    envCheck({
      name: "REDIS_URL",
      display: env.REDIS_URL ? redactDatabaseUrl(env.REDIS_URL).endpoint : "(unset)",
      ok: true,
      required: false,
      critical: false,
    }),
  ]
}

/**
 * Context-only lines (not pass/fail). Secrets and URLs live in envChecks.
 *
 * @param env - Validated server environment.
 * @param source - Process env bag for annotated overrides.
 * @returns Human-readable configuration lines for the preflight report.
 */
function ossConfigurationLines(env: ServerEnv, source: NodeJS.ProcessEnv): string[] {
  const database = redactDatabaseUrl(env.DATABASE_URL)
  const logLevel = source.LOG_LEVEL ?? "info"
  return [
    `NODE_ENV: ${source.NODE_ENV ?? process.env.NODE_ENV ?? "development"}`,
    `LOG_LEVEL: ${annotated("LOG_LEVEL", logLevel, source)}`,
    `LIMETRY_API_PORT: ${String(env.LIMETRY_API_PORT)}`,
    `DB Endpoint: ${database.endpoint}`,
    `DB Name:     ${database.name}`,
  ]
}

/**
 * Runs Limetry OSS preflight: env checks, telemetry probes, optional Postgres
 * and Redis connectivity, and listen URL context.
 *
 * @param env - Validated server environment.
 * @returns Aggregated preflight check results from `\@limetry/preflight`.
 * @throws When `\@limetry/preflight` `runPreflight` fails hard in production.
 */
export async function runOssPreflight(env: ServerEnv): Promise<PreflightCheck[]> {
  const source = process.env
  const production = isProduction(source.NODE_ENV)
  const telemetry = collectConfiguredTelemetry(source)
  const probes = [...telemetry.probes]

  if (env.USE_POSTGRES_STORE) {
    probes.push(createPostgresProbe({
      url: env.DATABASE_URL,
      required: production,
    }))
  }
  if (env.REDIS_URL) {
    probes.push(createRedisProbe({
      url: env.REDIS_URL,
      required: production,
      critical: false,
    }))
  }

  return runPreflight({
    product: "Limetry",
    appVersion: APP_VERSION,
    env: source,
    envChecks: [...collectOssEnvChecks(env, source.NODE_ENV), ...telemetry.envChecks],
    configuration: [...ossConfigurationLines(env, source), ...telemetry.configuration],
    probes,
    listenUrl: resolvePublicListenUrl(`http://localhost:${env.LIMETRY_API_PORT}`, source),
  })
}
