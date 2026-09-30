# Limetry Usage Guide

Limetry is open-source **agent action governance and telemetry**. Before an agent
does something irreversible or expensive, Limetry evaluates a policy, returns
`allow` / `deny` / `approval_required` + reasons, and writes a **scrubbed audit projection**
(`audit_mode=minimal` by default).

Optional adapters (`@limetry/ci`, `@limetry/sql`, `@limetry/shopify`) call the shared evaluate API
and enforce outcomes at the edge. Limetry does not custody funds.

**Privacy:** Evaluate uses the full intent. Audit stores a scrubbed projection. Do not put secrets or
full chat transcripts in `metadata` / `details`. Prefer `createSlimActionPolicy({ auditMode: "minimal" })`
and `redactDetails` / `redactActionIntent` from `@limetry/sdk`.

## What Limetry Helps With

- **Sensitive tool calls** — deny or require approval for `deploy`, `sql.write`, `shopify.refund`, …
- **Human-in-the-loop** — durable pending approvals bound to a payload hash
- **Audit/telemetry** — query scrubbed `policy.evaluated` and `action.recorded` events
- **Outcome integrity** — signed receipts so allow outcomes can be checked for tampering
- **Advisory by default** — enforce outcomes in your adapter / middleware

## Prerequisites

| Tool | Version | Purpose |
| --- | --- | --- |
| [Node.js](https://nodejs.org/) | 20+ | SDK, server, CLI, MCP, optional adapters |
| [Yarn](https://yarnpkg.com/) | 4.x (via Corepack) | Monorepo package manager |

## Setup

```bash
git clone https://github.com/limetry/sdk.git
cd limetry
corepack enable
yarn install
yarn build:sdk && yarn build:server && yarn build:cli
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
