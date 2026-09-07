/**
 * Postgres connectivity probe (`SELECT 1`) via optional peer dependency `pg`.
 */

import type { ConnectivityProbe, ProbeResult } from "../types.js"
import { DEFAULT_PROBE_TIMEOUT_MS } from "./http.js"

/**
 * Runs `SELECT 1` against Postgres. Requires optional peer `pg`.
 *
 * @param url - Postgres connection string.
 * @param timeoutMs - Connection timeout in milliseconds (default {@link DEFAULT_PROBE_TIMEOUT_MS}).
 * @returns Probe result; fails when `pg` is missing or the query errors.
 */
export async function probePostgres(
  url: string,
  timeoutMs = DEFAULT_PROBE_TIMEOUT_MS,
): Promise<ProbeResult> {
  const started = Date.now()
  let PoolCtor: typeof import("pg").Pool
  try {
    const pg = await import("pg")
    PoolCtor = pg.Pool
  } catch {
    return {
      ok: false,
      detail: "Database connection failed: pg is not installed in this process.",
    }
  }
  const pool = new PoolCtor({
    connectionString: url,
    connectionTimeoutMillis: timeoutMs,
    max: 1,
  })
  try {
    await pool.query("SELECT 1")
    return {
      ok: true,
      detail: `Database connected successfully (${Date.now() - started}ms).`,
    }
  } catch (error: unknown) {
    const reason = error instanceof Error ? error.message : "query failed"
    return {
      ok: false,
      detail: `Database connection failed (${Date.now() - started}ms): ${reason}`,
    }
  } finally {
    await pool.end()
  }
}

/**
 * Wraps {@link probePostgres} as a {@link ConnectivityProbe}.
 *
 * @param input - Connection options: `url` (Postgres connection string), `required` (whether
 *   failure can block startup), optional `critical` (hard-fail override when required), and
 *   optional `timeoutMs` (connection timeout forwarded to {@link probePostgres}).
 * @returns Named `"postgres"` connectivity probe.
 */
export function createPostgresProbe(input: {
  critical?: boolean
  required: boolean
  timeoutMs?: number
  url: string
}): ConnectivityProbe {
  return {
    name: "postgres",
    required: input.required,
    critical: input.critical,
    run: () => probePostgres(input.url, input.timeoutMs),
  }
}
