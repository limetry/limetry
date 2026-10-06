#!/usr/bin/env node
/**
 * Stdio MCP server for governed Postgres/Supabase SQL (`\@limetry/sql`).
 *
 * Owns `DATABASE_URL` (or `SUPABASE_DB_URL`) and never returns credentials to the model.
 * Requires `LIMETRY_API_KEY` and `LIMETRY_POLICY_ID`. Dry-run defaults on unless
 * `LIMETRY_SQL_DRY_RUN=false`.
 */

import { resolveLimetryBaseUrl } from "@limetry/sdk"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { z } from "zod"

import { SqlActionGate } from "./gate.js"

/**
 * Postgres connection string loaded from the process environment.
 */
const DATABASE_URL = process.env.DATABASE_URL ?? process.env.SUPABASE_DB_URL ?? ""

/**
 * Limetry API bearer token.
 */
const API_KEY = process.env.LIMETRY_API_KEY ?? process.env.LIMETRY_BEARER_TOKEN ?? ""

/**
 * ActionPolicy id used for SQL evaluation.
 */
const POLICY_ID = process.env.LIMETRY_POLICY_ID ?? ""

/**
 * Optional Limetry API base URL.
 */
const BASE_URL = resolveLimetryBaseUrl()

/**
 * Agent id for intents created by this MCP server.
 */
const AGENT_ID = process.env.LIMETRY_AGENT_ID ?? "sql_mcp"

/**
 * Resource label attached to SQL ActionIntents.
 */
const RESOURCE_LABEL = process.env.LIMETRY_SQL_RESOURCE ?? "postgres://*"

if (!DATABASE_URL) {
  process.stderr.write("Error: DATABASE_URL (or SUPABASE_DB_URL) is required.\n")
  process.exit(1)
}
if (!API_KEY || !POLICY_ID) {
  process.stderr.write("Error: LIMETRY_API_KEY and LIMETRY_POLICY_ID are required.\n")
  process.exit(1)
}

/**
 * Gate instance that holds DB credentials for this MCP process.
 */
const gate = new SqlActionGate({
  connectionString: DATABASE_URL,
  apiKey: API_KEY,
  baseUrl: BASE_URL,
  policyId: POLICY_ID,
  agentId: AGENT_ID,
  resourceLabel: RESOURCE_LABEL,
  dryRun: process.env.LIMETRY_SQL_DRY_RUN !== "false",
})

/**
 * MCP server exposing SQL evaluate / pending-approval tools.
 */
const server = new McpServer({
  name: "limetry-sql",
  version: "1.0.0",
})

server.tool(
  "limetry_sql_query",
  "Classify and evaluate a Postgres/Supabase SQL statement with Limetry. " +
    "Reads may execute when allowed and dry_run=false. Writes/DDL default to dry-run and may return approval_required.",
  {
    sql: z.string().min(1),
    dry_run: z.boolean().optional(),
    execute: z.boolean().optional(),
  },
  async ({ sql, dry_run, execute }) => {
    const result = await gate.evaluateAndMaybeExecute({
      sql,
      dryRun: dry_run,
      execute,
    })
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          sql_class: result.sqlClass,
          decision: result.evaluation.decision,
          approved: result.evaluation.approved,
          reasons: result.evaluation.reasons,
          decision_id: result.evaluation.decision_id,
          approval_id: result.evaluation.approval_id,
          dry_run: result.dryRun,
          executed: result.executed,
          rows: result.rows,
        }, null, 2),
      }],
    }
  },
)

server.tool(
  "limetry_sql_list_pending",
  "List SQL statements from this process that returned approval_required.",
  {},
  async () => {
    const pending = gate.listPending().map((entry) => ({
      approval_id: entry.approval_id,
      decision_id: entry.decision_id,
      sql_class: entry.sqlClass,
      sql_preview: entry.sql.slice(0, 200),
    }))
    return {
      content: [{
        type: "text",
        text: JSON.stringify({ pending }, null, 2),
      }],
    }
  },
)

/**
 * Stdio transport that connects the MCP server to the host process.
 */
const transport = new StdioServerTransport()
await server.connect(transport)
