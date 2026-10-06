#!/usr/bin/env node
/**
 * Stdio MCP server exposing Limetry policy evaluation, action recording, audit,
 * policy upsert, and approval tools (`\@limetry/mcp`).
 *
 * Requires `LIMETRY_API_KEY` (or `LIMETRY_BEARER_TOKEN`). Optional `LIMETRY_BASE_URL`
 * defaults to `https://api.limetry.org`.
 *
 * @packageDocumentation
 */

import { randomUUID } from "node:crypto"

import { APP_VERSION, redactDetails, resolveLimetryBaseUrl } from "@limetry/sdk"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { z } from "zod"

/**
 * Limetry HTTP API origin with trailing slash stripped.
 */
const BASE_URL = resolveLimetryBaseUrl()

/**
 * Bearer token used for all Limetry API calls.
 */
const API_KEY = process.env.LIMETRY_API_KEY ?? process.env.LIMETRY_BEARER_TOKEN ?? ""

if (!API_KEY) {
  process.stderr.write(
    "Error: LIMETRY_API_KEY environment variable is required.\n" +
    "Run `limetry setup` or set LIMETRY_API_KEY / LIMETRY_BEARER_TOKEN in your MCP config.\n",
  )
  process.exit(1)
}

/**
 * Sends a JSON request to the Limetry HTTP API.
 *
 * @param path - API path beginning with `/` (for example `/v1/policy/evaluate`).
 * @param body - JSON-serializable request body (ignored for `GET`).
 * @param method - HTTP method; defaults to `POST`.
 * @returns Parsed JSON response body.
 */
async function limetryFetch(path: string, body: unknown, method = "POST"): Promise<unknown> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: method === "GET" ? undefined : JSON.stringify(body),
  })

  return response.json()
}

/**
 * Performs an authenticated GET against the Limetry HTTP API.
 *
 * @param path - API path beginning with `/`, including query string when needed.
 * @returns Parsed JSON response body.
 */
async function limetryGet(path: string): Promise<unknown> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { "Authorization": `Bearer ${API_KEY}` },
  })
  return response.json()
}

/**
 * Zod schema for ActionIntent fields accepted by MCP tools.
 * Missing `intent_id` / `issued_at` are filled at call time.
 */
const actionIntentSchema = z.object({
  intent_id: z.string().uuid().optional().describe("Defaults to a new UUID"),
  policy_id: z.string().uuid().describe("Registered ActionPolicy id"),
  agent_id: z.string().min(1).describe("Agent performing the action"),
  action_type: z.string().min(1).describe("e.g. http_post, spend, email_send, deploy, delete"),
  resource: z.string().min(1).describe("Target resource URL, path, or identifier"),
  cost: z.object({
    amount_minor: z.number().int().nonnegative(),
    currency: z.string().min(3),
  }).optional().describe("Optional cost for spend-like actions"),
  metadata: z.record(z.string(), z.string()).optional(),
  issued_at: z.string().datetime().optional(),
  nonce: z.union([z.string(), z.number()]).optional(),
})

/**
 * MCP server instance registered with Limetry governance tools.
 */
const server = new McpServer({
  name: "limetry",
  version: APP_VERSION,
})

server.tool(
  "limetry_evaluate",
  "Evaluate an agent action intent against a Limetry action policy. " +
  "Returns allow, deny, or approval_required, reasons, a signed decision receipt, and writes an audit event. " +
  "Call this before irreversible or expensive tool calls (HTTP POST, deploy, delete, email, SQL write). " +
  "Send only fields needed for policy — avoid embedding API keys or chat transcripts in metadata.",
  {
    tenant_id: z.string().default("default"),
    policy_id: z.string().uuid().optional().describe("Overrides intent.policy_id when set"),
    intent: actionIntentSchema,
  },
  async ({ tenant_id, policy_id, intent }) => {
    const resolvedPolicyId = policy_id ?? intent.policy_id
    const payload = {
      tenant_id,
      policy_id: resolvedPolicyId,
      intent: {
        ...intent,
        intent_id: intent.intent_id ?? randomUUID(),
        policy_id: resolvedPolicyId,
        issued_at: intent.issued_at ?? new Date().toISOString(),
      },
    }
    const result = await limetryFetch("/v1/policy/evaluate", payload)
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    }
  },
)

server.tool(
  "limetry_record_action",
  "Record that an agent executed, skipped, or was blocked from an action after evaluation. " +
  "Writes a structured action.recorded audit/telemetry event. " +
  "Do not put secrets, tokens, or full chat transcripts in details — the server redacts known " +
  "secret keys, and default audit_mode=minimal drops the details bag from storage.",
  {
    tenant_id: z.string().default("default"),
    intent: actionIntentSchema,
    decision_id: z.string().optional().describe("Decision id from limetry_evaluate"),
    outcome: z.enum(["executed", "skipped", "blocked"]),
    details: z.record(z.string(), z.unknown()).optional(),
  },
  async ({ tenant_id, intent, decision_id, outcome, details }) => {
    const result = await limetryFetch("/v1/actions/record", {
      tenant_id,
      intent: {
        ...intent,
        intent_id: intent.intent_id ?? randomUUID(),
        issued_at: intent.issued_at ?? new Date().toISOString(),
      },
      decision_id,
      outcome,
      details: redactDetails(details),
    })
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    }
  },
)

server.tool(
  "limetry_list_audit",
  "List recent Limetry audit/telemetry events (policy evaluations and recorded actions).",
  {
    limit: z.number().int().positive().max(200).default(50),
    event_type: z.string().optional().describe("e.g. policy.evaluated, action.recorded"),
    agent_id: z.string().optional(),
    cursor: z.string().optional(),
  },
  async ({ limit, event_type, agent_id, cursor }) => {
    const params = new URLSearchParams()
    params.set("limit", String(limit))
    if (event_type) params.set("event_type", event_type)
    if (agent_id) params.set("agent_id", agent_id)
    if (cursor) params.set("cursor", cursor)
    const result = await limetryGet(`/v1/audit?${params.toString()}`)
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    }
  },
)

server.tool(
  "limetry_upsert_policy",
  "Create or update an ActionPolicy (allowed/denied action types, resource patterns, optional cost cap).",
  {
    tenant_id: z.string().default("default"),
    agent_id: z.string().describe("Agent id bound to the policy, or * for any"),
    allowed_action_types: z.array(z.string()).describe("Allowlist of action types"),
    denied_action_types: z.array(z.string()).optional(),
    allowed_resource_patterns: z.array(z.string()).optional().describe("Prefix or glob patterns"),
    blocked_resource_patterns: z.array(z.string()).optional(),
    max_cost_minor: z.number().int().nonnegative().optional().describe("Max cost in minor units"),
    currency: z.string().default("USD"),
    policy_id: z.string().uuid().optional(),
  },
  async (input) => {
    const { createSlimActionPolicy } = await import("@limetry/sdk")
    const policy = createSlimActionPolicy({
      agentId: input.agent_id,
      organizationId: input.tenant_id,
      allowedActionTypes: input.allowed_action_types,
      deniedActionTypes: input.denied_action_types,
      allowedResourcePatterns: input.allowed_resource_patterns,
      blockedResourcePatterns: input.blocked_resource_patterns,
      maxCostMinor: input.max_cost_minor,
      currency: input.currency,
      policyId: input.policy_id,
    })

    const result = await limetryFetch(
      `/v1/policies/${policy.policy_id}`,
      { tenant_id: input.tenant_id, policy },
      "PUT",
    )

    return {
      content: [{ type: "text", text: JSON.stringify({ ...result as object, policy_id: policy.policy_id }, null, 2) }],
    }
  },
)

server.tool(
  "limetry_list_approvals",
  "List pending (or filtered) Limetry approvals that require a human reviewer.",
  {
    status: z.enum(["pending", "approved", "denied", "all"]).default("pending"),
  },
  async ({ status }) => {
    const result = await limetryGet(`/v1/approvals?status=${encodeURIComponent(status)}`)
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    }
  },
)

server.tool(
  "limetry_resolve_approval",
  "Approve or deny a pending approval. When approving, pass the exact ActionIntent so the " +
  "server can verify the payload hash before marking the approval approved.",
  {
    approval_id: z.string().uuid(),
    decision: z.enum(["approve", "deny"]),
    reviewer: z.string().default("mcp-operator"),
    intent: actionIntentSchema.optional().describe("Required for approve when payload-hash binding is enforced"),
  },
  async ({ approval_id, decision, reviewer, intent }) => {
    const path = decision === "approve"
      ? `/v1/approvals/${approval_id}/approve`
      : `/v1/approvals/${approval_id}/deny`
    const result = await limetryFetch(path, {
      reviewer,
      intent: intent
        ? {
          ...intent,
          intent_id: intent.intent_id ?? randomUUID(),
          issued_at: intent.issued_at ?? new Date().toISOString(),
        }
        : undefined,
    })
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    }
  },
)

/**
 * Stdio transport that connects the MCP server to the host process.
 */
const transport = new StdioServerTransport()
await server.connect(transport)
