# Limetry — Agent Action Governance

## Project purpose

Limetry is open-source agent action governance: evaluate tool-call intents
(deploy, HTTP write, spend, delete, …), return allow/deny with reasons and an
HMAC decision receipt, and retain scrubbed audit projections (default
`audit_mode=minimal`). Wire it via MCP, CLI, or `@limetry/sdk`.

Limetry does not custody funds, run FROST/MPC threshold signing, or require chat
transcripts. Decisions are advisory until you enforce deny in the agent loop.

Packages may be consumed from this source checkout; npm publishing is separate.

## Mandatory coding patterns

### Evaluate ActionIntents before irreversible tools

```typescript
import {
  createSlimActionPolicy,
  RemotePolicyEngine,
  redactActionIntent,
} from "@limetry/sdk"

const policy = createSlimActionPolicy({
  agentId: "demo_agent",
  allowedActionTypes: ["http_get"],
  deniedActionTypes: ["http_post", "deploy"],
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

void redactActionIntent(intent)
```

### Import from `@limetry/sdk`

Key exports:

- `RemotePolicyEngine` / `createRemoteEngine()` — HTTP ActionIntent evaluate
- `createSlimActionPolicy` — slim `ActionPolicy` with `auditMode`
- `redactActionIntent`, `redactDetails`, `projectIntentForAudit` — privacy helpers
- `PolicyViolationError`, `RateLimitExceededError` — typed errors

Self-hosters must set `LIMETRY_BASE_URL` (default server `http://localhost:3810`).

## Never do this

- Do not put API keys, bearer tokens, passwords, or chat transcripts in
  `metadata` or record `details`.
- Do not invent FROST, MPC, `/v1/mpc/co-sign`, or threshold-signing APIs.
- Do not log private keys or bearer tokens.

## API server endpoints

- `GET /health` — service health
- `POST /v1/policy/evaluate` — ActionIntent (or legacy spend) evaluation
- `POST /v1/actions/record` — record executed / skipped / blocked
- `GET /v1/audit` — list scrubbed audit events
- `PUT /v1/policies/:id` — upsert policy
- Auth / tokens / rules routes as documented in the server package

## MCP integration

`@limetry/mcp` exposes:

- `limetry_evaluate`
- `limetry_record_action`
- `limetry_list_audit`
- `limetry_upsert_policy`

```json
{
  "mcpServers": {
    "limetry": {
      "command": "node",
      "args": ["/path/to/limetry/packages/mcp/dist/index.js"],
      "env": {
        "LIMETRY_API_KEY": "your-bearer-token",
        "LIMETRY_BASE_URL": "http://localhost:3810"
      }
    }
  }
}
```

Privacy: evaluate full intents for policy matching; audit stores scrubbed
projections (`minimal` by default). See `/docs/server/data-minimization`.
