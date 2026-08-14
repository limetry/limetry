import { type ActionPolicy,createSlimActionPolicy } from "@limetry/sdk"

/**
 * Cursor / Claude DB-tool policy for Postgres or Supabase.
 * SELECT allows. INSERT/UPDATE wait for approval. DROP/DDL is denied.
 */
export const sqlAgentDbPolicy: ActionPolicy = createSlimActionPolicy({
  policyId: "55555555-5555-4555-8555-555555555555",
  organizationId: "org_acme_data",
  agentId: "cursor_claude_sql",
  allowedActionTypes: ["sql.read", "sql.write"],
  deniedActionTypes: ["sql.ddl"],
  requireApprovalActionTypes: ["sql.write"],
  auditMode: "minimal",
})
