import { describe, expect, it, vi } from "vitest"

import { actionTypeForSqlClass, classifySql } from "./classify-sql.js"
import { SqlActionGate } from "./gate.js"

describe("classifySql", () => {
  it("classifies select as read", () => {
    expect(classifySql("SELECT * FROM users")).toBe("read")
    expect(actionTypeForSqlClass("read")).toBe("sql.read")
  })

  it("classifies insert/update/delete as write", () => {
    expect(classifySql("INSERT INTO users(id) VALUES (1)")).toBe("write")
    expect(classifySql("UPDATE users SET name='a'")).toBe("write")
    expect(classifySql("DELETE FROM users")).toBe("write")
  })

  it("classifies ddl statements", () => {
    expect(classifySql("DROP TABLE users")).toBe("ddl")
    expect(actionTypeForSqlClass("ddl")).toBe("sql.ddl")
  })

  it("treats unknown statements as unknown", () => {
    expect(classifySql("VACUUM FULL")).toBe("unknown")
  })
})

describe("SqlActionGate", () => {
  it("dry-runs writes and records pending approvals", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        ok: true,
        approved: false,
        decision: "approval_required",
        reasons: ["requires approval"],
        decision_id: "dec-1",
        approval_id: "appr-1",
      }),
    })) as unknown as typeof fetch

    const gate = new SqlActionGate({
      connectionString: "postgres://local/db",
      apiKey: "token",
      baseUrl: "http://localhost:3810",
      policyId: "11111111-1111-4111-8111-111111111111",
      dryRun: true,
      fetch: fetchMock,
      queryRunner: async () => {
        throw new Error("should not execute")
      },
    })

    const result = await gate.evaluateAndMaybeExecute({
      sql: "DELETE FROM users WHERE id = 1",
      execute: true,
    })

    expect(result.executed).toBe(false)
    expect(result.evaluation.decision).toBe("approval_required")
    expect(gate.listPending()).toHaveLength(1)
  })

  it("executes allowed reads when dryRun is false", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        ok: true,
        approved: true,
        decision: "allow",
        reasons: [],
        decision_id: "dec-2",
      }),
    })) as unknown as typeof fetch

    const gate = new SqlActionGate({
      connectionString: "postgres://local/db",
      apiKey: "token",
      baseUrl: "http://localhost:3810",
      policyId: "11111111-1111-4111-8111-111111111111",
      dryRun: false,
      fetch: fetchMock,
      queryRunner: async () => ({ rows: [{ id: 1 }] }),
    })

    const result = await gate.evaluateAndMaybeExecute({
      sql: "SELECT id FROM users",
      execute: true,
    })

    expect(result.executed).toBe(true)
    expect(result.rows).toEqual({ rows: [{ id: 1 }] })
  })
})
