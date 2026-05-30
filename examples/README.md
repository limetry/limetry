# Limetry examples

This directory contains sample **agent action governance** implementations: evaluate
a policy, return `allow` / `deny` / `approval_required` with reasons, and write a
structured audit event before a sensitive tool call runs.

> [!IMPORTANT]
> These are reference implementations, not a feature checklist. Agents that hold
> credentials need a server-authoritative gate — not a prompt instruction — between
> intent and irreversible side effect.

Start with three **real agent loops**, not consoles:

1. **GitHub Actions + Copilot coding agent** — `ci_privilege` allows, fork `deploy` denies before
   credentials load. Approval routing is opt-in via `require_approval_action_types`.
2. **Shopify support / ops agent** — a $10 refund allows, $500 exceeds `max_cost_minor` and denies,
   `shopify.inventory` denies outright.
3. **Cursor / Claude SQL tool** — SELECT allows, DROP and DELETE deny before the driver runs.
   Not a DBA console.

Send only fields needed for policy decisions. Prefer `createSlimActionPolicy({ auditMode: "minimal" })`
and SDK helpers `redactActionIntent` / `redactDetails` — the server also redacts secrets before audit
storage. See [Data minimization](https://limetry.org/docs/server/data-minimization).

## Quickstart

1. Follow [Quick Start](https://limetry.org/docs/quick-start) (`limetry setup` → `policy apply` →
   `eval` → `audit tail`).
2. Or configure [`@limetry/mcp`](../packages/mcp) and [`@limetry/sql`](../packages/sql) in Cursor /
   Claude and ask the agent to perform a blocked action.

## Test matrix (verified)

| Example | Automated tests | Command |
| --- | --- | --- |
| github-actions-ci-gate | Yes | `yarn workspace @examples/github-actions-ci-gate test` |
| shopify-mutation-firewall | Yes | `yarn workspace @examples/shopify-mutation-firewall test` |
| mcp-sql-write-gate | Yes | `yarn workspace @examples/mcp-sql-write-gate test` |
| openai-agent-procurement-governance | Yes | `yarn workspace @examples/openai-agent-procurement-governance test` |
| serverless-slack-aws-cost-control | Yes | `yarn workspace @examples/serverless-slack-aws-cost-control test` |
| langgraph-agent-payment-authorization | Yes | `cd … && pytest test_graph.py` |
| python-agent-langchain-governance | Yes | `cd … && pytest test_agent.py` |
| crewai-multi-agent-financial-approvals | Yes | `cd … && pytest test_crew.py` |
| autogen-saas-broker-nonce-deduplication | Yes | `cd … && pytest test_broker.py` |
| chatgpt-custom-gpt-payment-governance | Schema only | Import `openapi.json` into Custom GPT Actions |

Root helper for the TypeScript suites:

```bash
yarn test:examples
```

## Example catalog

### Action governance (recommended)

1. [github-actions-ci-gate](./github-actions-ci-gate) — Copilot coding agent + GitHub Actions (`@limetry/ci`);
   allow `ci_privilege`, deny fork `deploy` before credentials load
2. [shopify-mutation-firewall](./shopify-mutation-firewall) — Shopify support / ops agent (`@limetry/shopify`);
   not a Shopify App
3. [mcp-sql-write-gate](./mcp-sql-write-gate) — Cursor / Claude `limetry_sql_query` (`@limetry/sql`);
   not a DBA console or Supabase SQL editor
4. [openai-agent-procurement-governance](./openai-agent-procurement-governance) — OpenAI tool interception
5. [serverless-slack-aws-cost-control](./serverless-slack-aws-cost-control) — Slack + Lambda budget guard
6. [python-agent-langchain-governance](./python-agent-langchain-governance) — HTTP action intent checks
7. [crewai-multi-agent-financial-approvals](./crewai-multi-agent-financial-approvals) — role simulation + HTTP
8. [autogen-saas-broker-nonce-deduplication](./autogen-saas-broker-nonce-deduplication) — renewal action intents
9. [langgraph-agent-payment-authorization](./langgraph-agent-payment-authorization) — LangGraph evaluate/record
10. [chatgpt-custom-gpt-payment-governance](./chatgpt-custom-gpt-payment-governance) — OpenAPI Actions schema
