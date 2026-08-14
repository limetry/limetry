import { actionTypeForSqlClass, classifySql } from "@limetry/sql"
import { describe, expect, it, vi } from "vitest"

import { listPendingSql, runAgentSqlQuery } from "../src/cursor-db-tool.js"
import { setupDemoGate } from "../src/gate-demo.js"

function mockEvaluate(body: Record<string, unknown>): ReturnType<typeof vi.fn> {
  return vi.fn(async () =>
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  )
}

describe("Cursor / Claude SQL DB tool", () => {
  it("classifies SELECT as read, INSERT as write, and DROP as ddl", () => {
    expect(classifySql("SELECT * FROM users")).toBe("read")
    expect(actionTypeForSqlClass("read")).toBe("sql.read")
    expect(classifySql("INSERT INTO users (email) VALUES ('a@b.com')")).toBe("write")
    expect(actionTypeForSqlClass("write")).toBe("sql.write")
    expect(classifySql("DROP TABLE customers")).toBe("ddl")
    expect(actionTypeForSqlClass("ddl")).toBe("sql.ddl")
  })

  it("allows and executes SELECT from the agent DB tool", async () => {
    const fetchImpl = mockEvaluate({
      ok: true,
      approved: true,
      decision: "allow",
    })
    const queryRunner = vi.fn(async () => [{ id: 1, name: "alice" }])
    const gate = setupDemoGate({
      apiKey: "test-key",
      fetch: fetchImpl as unknown as typeof fetch,
      queryRunner,
    })

    const result = await runAgentSqlQuery(gate, "SELECT * FROM users")

    expect(result.tool).toBe("limetry_sql_query")
    expect(result.sql_class).toBe("read")
    expect(result.decision).toBe("allow")
    expect(result.executed).toBe(true)
    expect(result.rows).toEqual([{ id: 1, name: "alice" }])
    expect(queryRunner).toHaveBeenCalledTimes(1)
  })

  it("denies DROP before the query runner is called", async () => {
    const fetchImpl = mockEvaluate({
      ok: true,
      approved: false,
      decision: "deny",
      reasons: ["action_type sql.ddl is denied"],
    })
    const queryRunner = vi.fn()
    const gate = setupDemoGate({
      apiKey: "test-key",
      fetch: fetchImpl as unknown as typeof fetch,
      queryRunner,
    })

    const result = await runAgentSqlQuery(gate, "DROP TABLE customers")

    expect(result.sql_class).toBe("ddl")
    expect(result.decision).toBe("deny")
    expect(result.executed).toBe(false)
    expect(queryRunner).not.toHaveBeenCalled()
  })

  it("requires approval for INSERT and lists the pending statement", async () => {
    const fetchImpl = mockEvaluate({
      ok: true,
      approved: false,
      decision: "approval_required",
      reasons: ["action_type sql.write requires human approval"],
      approval_id: "approval-sql-insert",
    })
    const queryRunner = vi.fn()
    const gate = setupDemoGate({
      apiKey: "test-key",
      fetch: fetchImpl as unknown as typeof fetch,
      queryRunner,
    })

    const result = await runAgentSqlQuery(
      gate,
      "INSERT INTO users (email) VALUES ('a@b.com')",
    )

    expect(result.sql_class).toBe("write")
    expect(result.decision).toBe("approval_required")
    expect(result.executed).toBe(false)
    expect(result.approval_id).toBe("approval-sql-insert")
    expect(queryRunner).not.toHaveBeenCalled()

    const pending = listPendingSql(gate)
    expect(pending).toHaveLength(1)
    expect(pending[0]?.tool).toBe("limetry_sql_list_pending")
    expect(pending[0]?.approval_id).toBe("approval-sql-insert")
  })
})
