import { z } from "zod"

const WEAK_JWT_SECRETS = new Set([
  "your-jwt-secret-change-in-production",
  "your-super-secret-jwt-key-min-32-characters-long-change-in-prod",
])

const WEAK_BEARER_TOKENS = new Set([
  "replace-with-secure-bearer-token",
  "your-secure-bearer-token-here",
])

const WEAK_DECISION_SECRETS = new Set([
  "your-decision-hmac-secret-change-in-production",
])

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3030),
  LIMETRY_BEARER_TOKEN: z.string().min(16),
  DATABASE_URL: z.string().url().default("postgresql://localhost:5432/limetry"),
  JWT_SECRET: z.string().min(32),
  REPLAY_WINDOW_MS: z.coerce.number().int().positive().default(300_000),
  THROTTLE_MAX_REQUESTS_PER_MINUTE: z.coerce.number().int().positive().default(5),
  REDIS_URL: z.string().url().optional(),
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
  DECISION_HMAC_SECRET: z.string().min(32).optional(),
})

export type ServerEnv = z.infer<typeof envSchema>

function isNonDevEnvironment(nodeEnv: string | undefined): boolean {
  return nodeEnv !== "development" && nodeEnv !== "test" && nodeEnv !== undefined
}

export function decisionReceiptSecret(env: ServerEnv): string {
  return env.DECISION_HMAC_SECRET ?? env.JWT_SECRET
}

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

  return parsed.data
}
