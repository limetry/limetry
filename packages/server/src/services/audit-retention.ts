/**
 * Periodic purge of aged `limetry_audit_log` rows for OSS Postgres deployments.
 */

import type { Pool } from "pg"

/**
 * Deletes limetry_audit_log rows older than retentionDays.
 * No-op when retentionDays is 0.
 *
 * @param pool - Postgres pool.
 * @param retentionDays - Age threshold in days; `<= 0` skips deletion.
 * @returns Count of deleted rows.
 * @throws When the DELETE query fails.
 */
export async function purgeExpiredOssAuditRows(
  pool: Pool,
  retentionDays: number,
): Promise<{ rowsDeleted: number }> {
  if (retentionDays <= 0) {
    return { rowsDeleted: 0 }
  }

  const result = await pool.query(
    `DELETE FROM limetry_audit_log
     WHERE created_at < NOW() - ($1::int * INTERVAL '1 day')`,
    [retentionDays],
  )

  return { rowsDeleted: result.rowCount ?? 0 }
}

/**
 * Schedules periodic OSS audit retention purge. Returns a disposer.
 *
 * Runs immediately once, then on `intervalMs`. Uses `unref` so the timer does
 * not keep the process alive alone.
 *
 * @param pool - Postgres pool.
 * @param options - Retention days, interval, and optional log sink.
 * @returns Function that clears the interval timer.
 */
export function startOssAuditRetentionPurge(
  pool: Pool,
  options: {
    retentionDays: number
    intervalMs: number
    log?: (message: string) => void
  },
): () => void {
  const log = options.log ?? ((message: string) => {
    process.stdout.write(`${message}\n`)
  })

  const run = (): void => {
    void purgeExpiredOssAuditRows(pool, options.retentionDays)
      .then((result) => {
        if (result.rowsDeleted > 0) {
          log(`Limetry audit retention purged ${result.rowsDeleted} row(s)`)
        }
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error)
        log(`Limetry audit retention purge failed: ${message}`)
      })
  }

  run()
  const timer = setInterval(run, options.intervalMs)
  timer.unref?.()

  return () => {
    clearInterval(timer)
  }
}
