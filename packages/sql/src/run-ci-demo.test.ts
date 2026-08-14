import { describe, expect, it, vi } from "vitest"

import { runSqlCiDemo } from "./run-ci-demo.js"

function mockEvaluate(decision: "allow" | "deny", reasons: string[] = []) {
  return vi.fn(async () => ({
    ok: true,
    json: async () => ({
      ok: true,
      approved: decision === "allow",
      decision,
      reasons,
      decision_id: "dec-sql-ci",
    }),
  })) as unknown as typeof fetch
}

const baseEnv = {
  INPUT_LIMETRY_API_KEY: "token",
  INPUT_POLICY_ID: "55555555-5555-4555-8555-555555555555",
  INPUT_LIMETRY_BASE_URL: "http://localhost:3810",
  DATABASE_URL: "postgresql://limetry:limetry@127.0.0.1:5432/limetry",
}

describe("runSqlCiDemo", () => {
  it("returns 1 when api key or policy id is missing", async () => {
    expect(await runSqlCiDemo({})).toBe(1)
  })

  it("allows SELECT and executes through the query runner", async () => {
    const queryRunner = vi.fn(async () => ({ rows: [{ ok: 1 }] }))
    const code = await runSqlCiDemo(
      { ...baseEnv, INPUT_SQL: "SELECT 1 AS ok", INPUT_EXECUTE: "true" },
      { fetch: mockEvaluate("allow"), queryRunner },
    )
    expect(code).toBe(0)
    expect(queryRunner).toHaveBeenCalledOnce()
  })

  it("denies DROP TABLE before execute", async () => {
    const queryRunner = vi.fn(async () => {
      throw new Error("should not execute DDL")
    })
    const code = await runSqlCiDemo(
      { ...baseEnv, INPUT_SQL: "DROP TABLE customers", INPUT_EXECUTE: "true" },
      { fetch: mockEvaluate("deny", ["action_type sql.ddl is denied"]), queryRunner },
    )
    expect(code).toBe(1)
    expect(queryRunner).not.toHaveBeenCalled()
  })

  it("denies DELETE before execute", async () => {
    const queryRunner = vi.fn()
    const code = await runSqlCiDemo(
      { ...baseEnv, INPUT_SQL: "DELETE FROM customers", INPUT_EXECUTE: "true" },
      { fetch: mockEvaluate("deny", ["action_type sql.write is denied"]), queryRunner },
    )
    expect(code).toBe(1)
    expect(queryRunner).not.toHaveBeenCalled()
  })
})
