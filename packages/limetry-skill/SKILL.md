---
name: limetry-governance
description: >-
  Evaluate AI agent tool-call intents with Limetry — allow, deny with reasons,
  and scrubbed audit projections. MCP, CLI, and SDK.
allowed-tools: read_file, write_file, replace_file_content, run_command
compatibility: Claude Code, Claude Desktop, Cursor
metadata:
  author: Limetry
  version: "2.0"
---

# Limetry — Agent Action Governance Skill

Limetry is open-source **agent action governance**: evaluate tool-call intents
(deploy, HTTP write, spend, delete, email, …), return allow/deny with reasons and
a signed decision receipt, and retain **scrubbed audit projections** (default
`audit_mode=minimal`). Wire it via MCP, CLI, or `@limetry/sdk`.

Limetry does **not** custody funds or log chat transcripts. Decisions are advisory
until you enforce deny in the agent loop or at the resource.

---

## Mandatory agent behavior

1. **Evaluate before irreversible tools**: Call `limetry_evaluate` (MCP),
   `RemotePolicyEngine.evaluateAction` (SDK), or `limetry eval` (CLI) before
   deploy, HTTP write, spend, delete, or similar side effects.
1. **Enforce deny**: If the decision is deny, stop and explain `reasons` to the
   user. Do not retry the same irreversible tool without a new evaluation.
1. **Minimize what you send**: Put only fields needed for policy in
   `ActionIntent` (`action_type`, `resource`, optional `cost`). Never put API
   keys, bearer tokens, passwords, or full chat transcripts in `metadata` or
   record `details`.
1. **Prefer minimal audit**: Use `createSlimActionPolicy({ auditMode: "minimal" })`
   unless the operator explicitly needs `forensics` (redacted metadata/details).
1. **No credential logging**: Never print, log, or store bearer tokens, API keys,
   or private keys.

---

## Quickstart (SDK)

```typescript
import {
  createSlimActionPolicy,
  RemotePolicyEngine,
  redactActionIntent,
  redactDetails,
} from "@limetry/sdk"

const policy = createSlimActionPolicy({
  agentId: "demo_agent",
  allowedActionTypes: ["http_get"],
  deniedActionTypes: ["http_post", "deploy", "delete"],
  blockedResourcePatterns: ["https://prod.example.com/*"],
  auditMode: "minimal",
})

const engine = new RemotePolicyEngine({
  apiKey: process.env.LIMETRY_API_KEY ?? process.env.LIMETRY_BEARER_TOKEN,
  baseUrl: process.env.LIMETRY_BASE_URL ?? "http://localhost:3810",
})

const intent = {
  intent_id: crypto.randomUUID(),
  policy_id: policy.policy_id,
  agent_id: "demo_agent",
  action_type: "http_post",
  resource: "https://prod.example.com/deploy",
  issued_at: new Date().toISOString(),
}

const decision = await engine.evaluateAction(intent)
if (!decision.approved) {
  throw new Error(decision.reasons.join("; "))
}

/**
 * Evaluate with the full intent. Use redact helpers for local logs only —
 * the server also scrubs before audit storage.
 */
const safeForLogs = redactActionIntent(intent)
void redactDetails({ path: "/ok" })
void safeForLogs
```

Spend-domain tooling (`GuardedAgentWallet`, Rust `LimetryEngine` FFI) is optional
for payment-shaped `TransactionIntent` flows — not the primary product path.

---

## MCP tools

Prefer MCP in Cursor / Claude Desktop:

- `limetry_evaluate` — evaluate an `ActionIntent`
- `limetry_record_action` — record executed / skipped / blocked (details are
  client-redacted; server drops details bag under `minimal`)
- `limetry_list_audit` — tail scrubbed audit events
- `limetry_upsert_policy` — create/update a slim `ActionPolicy`

---

## Environment

| Variable | Purpose |
| --- | --- |
| `LIMETRY_API_KEY` / `LIMETRY_BEARER_TOKEN` | Bearer for evaluate / record / audit |
| `LIMETRY_BASE_URL` | Server URL (self-host default `http://localhost:3810`) |
| `LIMETRY_DEFAULT_AUDIT_MODE` | Server default when policy omits `audit_mode` (`minimal` \| `forensics`) |

See docs: `/docs/server/data-minimization` and `/docs/quick-start`.

---

## ActionPolicy (primary)

Prefer slim builders. Required ideas:

- `allowed_action_types` / optional `denied_action_types`
- optional `allowed_resource_patterns` / `blocked_resource_patterns`
- optional `max_cost_minor` + `currency`
- `audit_mode`: `minimal` (default) or `forensics`
- `status`: `active` | `suspended` | `revoked`

Do **not** invent `mpc`, FROST, or threshold-signing blocks — they are not part of
the shipped product.

Optional spend-domain `SpendingPolicy` (limits, velocity, replay, destination
rules) still exists for wallet/FFI demos; generate it only when the user asks for
spend-policy governance.

---

## Utility scripts

| Script | Purpose | Command |
| --- | --- | --- |
| `scripts/validate_policy.mjs` | Validate policy JSON | `node scripts/validate_policy.mjs --file <path>` |
| `scripts/evaluate_intent.mjs` | Dry-run evaluation | `node scripts/evaluate_intent.mjs --policy p --intent i` |
