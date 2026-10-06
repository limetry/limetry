/**
 * Zod-validated process environment for `\@limetry/server`.
 *
 * Enforces bearer/JWT strength outside development/test, requires Postgres in
 * production, and resolves the HMAC secret used for decision receipts.
 */

import { z } from "zod"

/**
 * Placeholder JWT secrets rejected outside development/test.
 */
const WEAK_JWT_SECRETS = new Set([
  "your-jwt-secret-change-in-production",
  "your-super-secret-jwt-key-min-32-characters-long-change-in-prod",
])

/**
 * Placeholder bearer tokens rejected outside development/test.
 */
const WEAK_BEARER_TOKENS = new Set([
  "replace-with-secure-bearer-token",
  "your-secure-bearer-token-here",
])

/**
 * Placeholder decision HMAC secrets rejected in production-like environments.
 */
const WEAK_DECISION_SECRETS = new Set([
  "your-decision-hmac-secret-change-in-production",
])

/**
 * Coerces blank strings to `undefined` so optional URL fields parse cleanly.
 *
 * @param val - Raw env value.
 * @returns `undefined` when blank; otherwise the original value.
 */
const emptyStringToUndefined = (val: unknown): unknown =>
  typeof val === "string" && val.trim() === "" ? undefined : val

/**
 * Schema for server configuration read from `process.env` (or a test bag).
 */
const envSchema = z.object({
  LIMETRY_API_PORT: z.coerce.number().int().positive().default(3810),
  LIMETRY_BEARER_TOKEN: z.string().min(16),
  DATABASE_URL: z.string().url().default("postgresql://localhost:5432/limetry"),
  JWT_SECRET: z.string().min(32),
  REPLAY_WINDOW_MS: z.coerce.number().int().positive().default(300_000),
  THROTTLE_MAX_REQUESTS_PER_MINUTE: z.coerce.number().int().positive().default(5),
  LOAD_TEST_POLICY_JSON: z.preprocess(
    emptyStringToUndefined,
    z.string().optional(),
  ),
  REDIS_URL: z.preprocess(
    emptyStringToUndefined,
    z.string().url().optional(),
  ),
  USE_POSTGRES_STORE: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  /**
   * Default audit retention shape when ActionPolicy.audit_mode is unset.
   */
  LIMETRY_DEFAULT_AUDIT_MODE: z.enum(["minimal", "forensics"]).default("minimal"),
  /**
   * Days to keep rows in limetry_audit_log when Postgres store is enabled.
   * Set to 0 to disable automatic purge.
   */
  LIMETRY_AUDIT_RETENTION_DAYS: z.coerce.number().int().nonnegative().default(90),
  LIMETRY_AUDIT_PURGE_INTERVAL_MS: z.coerce.number().int().positive().default(3_600_000),
  DECISION_HMAC_SECRET: z.preprocess(
    emptyStringToUndefined,
    z.string().min(32).optional(),
  ),
})

/**
 * Parsed and validated `\@limetry/server` environment.
 */
export type ServerEnv = z.infer<typeof envSchema>

/**
 * Returns true when `NODE_ENV` is neither development nor test (and is defined).
 *
 * @param nodeEnv - Value of `NODE_ENV`.
 * @returns Whether the process should enforce production-strength secrets.
 */
function isNonDevEnvironment(nodeEnv: string | undefined): boolean {
  return nodeEnv !== "development" && nodeEnv !== "test" && nodeEnv !== undefined
}

/**
 * Resolves the HMAC secret used to sign decision receipts.
 *
 * Prefers `DECISION_HMAC_SECRET`, falling back to `JWT_SECRET`.
 *
 * @param env - Validated server environment.
 * @returns Secret string of at least 32 characters when env is valid.
 */
export function decisionReceiptSecret(env: ServerEnv): string {
  return env.DECISION_HMAC_SECRET ?? env.JWT_SECRET
}

/**
 * Returns true when a URL hostname is a loopback address.
 *
 * @param value - Absolute URL string.
 * @returns `true` for localhost / 127.0.0.1 / ::1; `false` on parse failure.
 */
function isLoopbackUrl(value: string): boolean {
  try {
    const host = new URL(value).hostname
    return host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "[::1]"
  } catch {
    return false
  }
}

/**
 * Parses and validates server environment from a process-env bag.
 *
 * Outside production, missing `LIMETRY_BEARER_TOKEN` / `JWT_SECRET` receive
 * weak development defaults. Production and other non-dev environments reject
 * weak secrets, require `DECISION_HMAC_SECRET`, require `USE_POSTGRES_STORE=true`,
 * and reject loopback `DATABASE_URL`.
 *
 * @param source - Env bag to parse; defaults to `process.env`.
 * @returns Validated {@link ServerEnv}.
 * @throws Error When Zod parse fails or production-strength checks fail.
 */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): ServerEnv {
  const sourceWithDefaults: NodeJS.ProcessEnv = { ...source }
  const nodeEnv = sourceWithDefaults.NODE_ENV ?? process.env.NODE_ENV
  if (!sourceWithDefaults.LIMETRY_BEARER_TOKEN && nodeEnv !== "production") {
    sourceWithDefaults.LIMETRY_BEARER_TOKEN = "replace-with-secure-bearer-token"
  }
  if (!sourceWithDefaults.JWT_SECRET && nodeEnv !== "production") {
    sourceWithDefaults.JWT_SECRET = "your-jwt-secret-change-in-production"
  }

  const parsed = envSchema.safeParse(sourceWithDefaults)

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ")

    throw new Error(`Invalid server environment: ${details}`)
  }

  const jwtSecret = parsed.data.JWT_SECRET
  const bearerToken = parsed.data.LIMETRY_BEARER_TOKEN
  const decisionSecret = parsed.data.DECISION_HMAC_SECRET

  if (isNonDevEnvironment(nodeEnv) || nodeEnv === "production") {
    if (
      !source.JWT_SECRET ||
      WEAK_JWT_SECRETS.has(jwtSecret) ||
      jwtSecret.length < 32
    ) {
      throw new Error(
        "JWT_SECRET must be set to a unique value of at least 32 characters outside development/test",
      )
    }

    if (
      !source.LIMETRY_BEARER_TOKEN ||
      WEAK_BEARER_TOKENS.has(bearerToken) ||
      bearerToken.length < 32
    ) {
      throw new Error(
        "LIMETRY_BEARER_TOKEN must be set to a unique value of at least 32 characters outside development/test",
      )
    }

    if (
      !decisionSecret ||
      WEAK_DECISION_SECRETS.has(decisionSecret) ||
      decisionSecret.length < 32
    ) {
      throw new Error(
        "DECISION_HMAC_SECRET must be set to a unique value of at least 32 characters in production",
      )
    }
  }

  if (nodeEnv === "production" && !parsed.data.USE_POSTGRES_STORE) {
    throw new Error(
      "USE_POSTGRES_STORE=true is required in production. In-memory stores are not durable.",
    )
  }

  if (nodeEnv === "production" && (!source.DATABASE_URL || isLoopbackUrl(parsed.data.DATABASE_URL))) {
    throw new Error(
      "DATABASE_URL must be set to a non-loopback Postgres host in production",
    )
  }

  return parsed.data
}
