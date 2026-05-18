import { describe, expect, it } from "vitest"

import { purgeExpiredOssAuditRows } from "./audit-retention.js"

describe("purgeExpiredOssAuditRows", () => {
  it("skips deletion when retentionDays is 0", async () => {
    const pool = {
      query: async () => {
        throw new Error("should not query")
      },
    }
    const result = await purgeExpiredOssAuditRows(pool as never, 0)
    expect(result.rowsDeleted).toBe(0)
  })

  it("deletes expired rows using retention days", async () => {
    const calls: unknown[][] = []
    const pool = {
      query: async (sql: string, params: unknown[]) => {
        calls.push([sql, params])
        return { rowCount: 3 }
      },
    }
    const result = await purgeExpiredOssAuditRows(pool as never, 90)
    expect(result.rowsDeleted).toBe(3)
    expect(calls[0]?.[1]).toEqual([90])
    expect(String(calls[0]?.[0])).toContain("limetry_audit_log")
  })
})
