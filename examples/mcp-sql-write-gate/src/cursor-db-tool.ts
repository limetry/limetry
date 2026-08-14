import type { SqlActionGate, SqlGateResult } from "@limetry/sql"

export type AgentDbToolName = "limetry_sql_query" | "limetry_sql_list_pending"

export type AgentDbQueryResult = {
  tool: "limetry_sql_query"
  sql_class: SqlGateResult["sqlClass"]
  decision: string
  approved: boolean
  executed: boolean
  reasons: string[]
  decision_id?: string
  approval_id?: string
  rows?: unknown
}

/**
 * Cursor / Claude DB tool — not a DBA console.
 * The model calls limetry_sql_query. Credentials stay in the MCP process.
 */
export async function runAgentSqlQuery(
  gate: SqlActionGate,
  sql: string,
  execute = true,
): Promise<AgentDbQueryResult> {
  const result = await gate.evaluateAndMaybeExecute({
    sql,
    execute,
  })

  return {
    tool: "limetry_sql_query",
    sql_class: result.sqlClass,
    decision: result.evaluation.decision ?? (result.evaluation.approved ? "allow" : "deny"),
    approved: Boolean(result.evaluation.approved),
    executed: result.executed,
    reasons: result.evaluation.reasons ?? [],
    decision_id: result.evaluation.decision_id,
    approval_id: result.evaluation.approval_id,
    rows: result.rows,
  }
}

/**
 * List statements that returned approval_required in this MCP process.
 */
export function listPendingSql(gate: SqlActionGate): Array<{
  tool: "limetry_sql_list_pending"
  approval_id: string
  sql_class: string
  sql_preview: string
}> {
  return gate.listPending().map((entry) => ({
    tool: "limetry_sql_list_pending" as const,
    approval_id: entry.approval_id,
    sql_class: entry.sqlClass,
    sql_preview: entry.sql.slice(0, 200),
  }))
}
