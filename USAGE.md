# Limetry Usage Guide

Limetry is open-source **agent action governance and telemetry**. Before an agent
does something irreversible or expensive, Limetry evaluates a policy, returns
`allow` / `deny` / `approval_required` + reasons, and writes a **scrubbed audit projection**
(`audit_mode=minimal` by default).

Optional adapters (`@limetry/ci`, `@limetry/sql`, `@limetry/shopify`) call the shared evaluate API
and enforce outcomes at the edge. Limetry does not custody funds.

**Privacy:** Evaluate uses the full intent. Audit stores a scrubbed projection. Do not put secrets or
full chat transcripts in `metadata` / `details`. Prefer `createSlimActionPolicy({ auditMode: "minimal" })`
and `redactDetails` / `redactActionIntent` from `@limetry/sdk`, or
`create_slim_action_policy(audit_mode="minimal")` and `redact_details` / `redact_action_intent`
from `limetry` (Python).

## What Limetry Helps With

- **Sensitive tool calls** — deny or require approval for `deploy`, `sql.write`, `shopify.refund`, …
- **Human-in-the-loop** — durable pending approvals bound to a payload hash
- **Audit/telemetry** — query scrubbed `policy.evaluated` and `action.recorded` events
- **Outcome integrity** — signed receipts so allow outcomes can be checked for tampering
- **Advisory by default** — enforce outcomes in your adapter / middleware

## Prerequisites

| Tool | Version | Purpose |
| --- | --- | --- |
| [Node.js](https://nodejs.org/) | 20+ | TypeScript SDK, server, CLI, MCP, optional adapters |
| [Python](https://www.python.org/) | 3.11+ | Python SDK (`limetry`) |
| Package manager for published packages | npm 10+, Yarn, or pnpm | Use the package manager you prefer |
| Package manager for this repository | Yarn Berry 4.13 | Use Corepack and the committed Yarn workspace |

## Install the published packages

```bash
npm install -g @limetry/cli
npm install @limetry/sdk
npx -y @limetry/mcp
pip install limetry
```

Use the package manager you prefer; the equivalent Yarn or pnpm commands work
the same way. The CLI is ready with `limetry setup`. Python agents use
`pip install limetry` (also `conda install -c conda-forge limetry`).

## Run from source

Clone the repository for local development or self-hosting, then use the
repository's Yarn Berry workspace. Do not run npm or pnpm install from the
cloned repository because its workspace protocols and resolutions are Yarn-specific:

```bash
git clone https://github.com/limetry/limetry.git
cd limetry
corepack enable
yarn install
yarn build:sdk
yarn build:preflight
yarn build:server
yarn build:cli
cp .env.example .env
yarn dev:server
```

The server prints a human-readable preflight banner on boot (secrets masked,
then Postgres/Redis when those stores are enabled). Production fails fast if
required checks fail. The marketing site logs the same for public URLs/emails
only — it does not probe APIs. On Vercel or `next build`, unset `NEXT_PUBLIC_*`
site URLs resolve from `VERCEL_URL` / canonical hosts (`limetry.com`,
`app.limetry.com`, `api.limetry.com`) so those vars do not need to be copied
into each deploy environment.

## Quickstart (CLI)

```bash
limetry setup
limetry policy apply --agent-id demo --allow http_get --deny http_post \
  --block-resource "https://prod.example.com/*"
echo '{"intent_id":"...","policy_id":"...","agent_id":"demo","action_type":"http_post","resource":"https://prod.example.com/x","issued_at":"2026-07-21T20:00:00.000Z"}' \
  | limetry eval
limetry approvals list
limetry audit tail -n 20
```

## Evaluate from Python

```bash
pip install limetry
```

```python
from limetry import create_remote_engine, create_slim_action_policy, redact_action_intent
import uuid
from datetime import datetime, timezone

policy = create_slim_action_policy(
  agent_id="demo",
  allowed_action_types=["http_get"],
  denied_action_types=["http_post"],
  audit_mode="minimal",
)
intent = {
  "intent_id": str(uuid.uuid4()),
  "policy_id": policy["policy_id"],
  "agent_id": "demo",
  "action_type": "http_post",
  "resource": "https://prod.example.com/x",
  "issued_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
}
engine = create_remote_engine()
print(engine.evaluate_action(intent))
print(redact_action_intent(intent))
```

## Example adapters

### CI

```bash
yarn workspace @limetry/ci build
# See packages/ci/examples/workflow.yml and packages/ci/README.md
```

### SQL (Postgres / Supabase MCP)

```bash
yarn workspace @limetry/sql build
# DATABASE_URL + LIMETRY_API_KEY + LIMETRY_POLICY_ID — see packages/sql/README.md
```

### Shopify

```bash
yarn workspace @limetry/shopify build
# SHOPIFY_ADMIN_TOKEN stays inside the firewall — see packages/shopify/README.md
```

## Approvals API

- `GET /v1/approvals?status=pending`
- `POST /v1/approvals/:id/approve` with `{ reviewer, intent }` (intent must match payload hash)
- `POST /v1/approvals/:id/deny` with `{ reviewer }`

CLI: `limetry approvals list|approve|deny`. MCP: `limetry_list_approvals`, `limetry_resolve_approval`.
