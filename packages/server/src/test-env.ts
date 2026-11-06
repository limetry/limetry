/**
 * Shared {@link ServerEnv} fixtures for Vitest.
 */

import type { ServerEnv } from "./env.js"

/** Docs RAG defaults for hand-built ServerEnv objects in unit tests. */
export const ragTestEnvDefaults = {
  LIMETRY_RAG_BACKEND: "memory",
  LIMETRY_RAG_CORPUS_PATH: "docs/ai-rag/corpus/rag-corpus.json",
  LIMETRY_RAG_CHAT_PUBLIC: true,
} as const satisfies Partial<ServerEnv>

/**
 * Builds a complete non-Postgres test env.
 *
 * @param overrides - Field overrides.
 * @returns ServerEnv suitable for `createApp`.
 */
export function testServerEnv(overrides: Partial<ServerEnv> = {}): ServerEnv {
  return {
    LIMETRY_API_PORT: 3810,
    LIMETRY_API_PATH_PREFIX: "",
    LIMETRY_BEARER_TOKEN: "test-bearer-token-123456",
    DATABASE_URL: "postgresql://localhost:5432/limetry",
    DATABASE_SCHEMA_NAME: "evaluate",
    SQLITE_DATABASE_PATH: ":memory:",
    JWT_SECRET: "test-jwt-secret-at-least-32-characters",
    REPLAY_WINDOW_MS: 300_000,
    THROTTLE_MAX_REQUESTS_PER_MINUTE: 50,
    USE_POSTGRES_STORE: false,
    LIMETRY_DEFAULT_AUDIT_MODE: "minimal",
    LIMETRY_AUDIT_RETENTION_DAYS: 90,
    LIMETRY_AUDIT_PURGE_INTERVAL_MS: 3_600_000,
    DECISION_HMAC_SECRET: "test-decision-hmac-secret-at-least-32-chars",
    ...ragTestEnvDefaults,
    ...overrides,
  }
}
