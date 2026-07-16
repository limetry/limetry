/**
 * In-repo blog post metadata and markdown bodies for the marketing site.
 */

import { siteUrls } from "@/lib/site-urls"

/**
 * Metadata and markdown body for one marketing blog post.
 */
export interface BlogPost {
  slug: string
  title: string
  date: string
  /**
   * YYYY-MM-DD for sorting/git logic.
   */
  dateRaw: string
  description: string
  readTime: string
  tags: string[]
  /**
   * Markdown or plain text with HTML tags.
   */
  content: string
}

/**
 * Published blog posts rendered under `/blog/[slug]`.
 */
export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "2026-04-announcing-limetry",
    title: "Open-source agent action governance",
    date: "April 14, 2026",
    dateRaw: "2026-04-14",
    description:
      "Evaluate agent tool calls against ActionPolicy, return allow/deny with reasons, and store a privacy-safe audit trail. Self-host the open source evaluation server.",
    readTime: "8 min read",
    tags: ["Launch", "Engineering"],
    content: `
# Open-source agent action governance

*Updated July 2026 — framing is evaluate → deny → audit. Optional cost fields on ActionIntent cover spend-shaped actions.*

Limetry is open-source evaluate → deny → audit for agent tool calls: MCP, CLI, SDK, and a self-run evaluation server.

Agents browse, purchase, deploy, delete, and call external APIs. Irreversible side effects cannot be undone from a prompt. Evaluate policy before the tool runs. Limetry returns allow/deny with reasons and writes a privacy-safe audit trail (\`audit_mode=minimal\` by default).

Payments are one optional policy domain (amount / merchant fields), not a custody layer.

## Check an action intent

POST evaluate of an \`ActionIntent\` against an \`ActionPolicy\`. Signed outcome receipts let middleware detect tampering.

\`\`\`typescript
import { RemotePolicyEngine, createSlimActionPolicy } from "@limetry/sdk"

const engine = new RemotePolicyEngine({
  apiKey: process.env.LIMETRY_BEARER_TOKEN!,
  baseUrl: "http://localhost:3810",
})
const policy = createSlimActionPolicy({
  allowedTypes: ["http_post", "deploy"],
  auditMode: "minimal",
})
const decision = await engine.evaluateAction(intent, policy)
\`\`\`

## What evaluate provides

1. **Server-authoritative action policy**: Types, resource patterns, optional cost caps — evaluate over HTTP from MCP, CLI, or SDK.
2. **Decision integrity**: Signed outcome receipts bind allow/deny so middleware can detect tampering.
3. **Privacy-safe audit**: Evaluate uses full intent; storage keeps a minimized projection. Do not put secrets in \`metadata\`/\`details\`.

## Self-host Limetry

Limetry (open source) includes the SDK, self-run evaluation server, CLI, and MCP package. You operate the node and retention.

Start with the [GitHub repository](${siteUrls.github}) or the [quick start](/docs/quick-start). For production ops, see [self-run setup](/docs/server/self-run setup).
`,
  },
  {
    slug: "2026-05-remote-policy-engine-http",
    title: "Call the Limetry SDK remotely from remote runtimes",
    date: "May 10, 2026",
    dateRaw: "2026-05-10",
    description:
      "POST evaluate from Node or any remote runtime. Point baseUrl at your self-run Limetry server.",
    readTime: "6 min read",
    tags: ["SDK", "Integrations"],
    content: `
# Call the Limetry SDK remotely from remote runtimes

Use \`RemotePolicyEngine\` anywhere HTTPS works: local Node, server function, edge runtimes, or edge Workers. No native binary required.

## Configure HTTP evaluate

Point \`baseUrl\` at your self-run Limetry server:

\`\`\`typescript
import { RemotePolicyEngine, createSlimActionPolicy } from "@limetry/sdk"

const engine = new RemotePolicyEngine({
  apiKey: process.env.LIMETRY_API_KEY,
  baseUrl: "${siteUrls.api}",
})

const decision = await engine.evaluateAction(intent, policy)
\`\`\`

## Runtime options

- **Local**: Run evaluate against \`http://localhost:3810\` during development.
- **self-run**: Deploy the evaluation server; you own retention, keys, and uptime. See [self-run setup](/docs/server/self-run setup).
`,
  },
  {
    slug: "2026-05-securing-procurement-agents",
    title: "Cap agent purchases with action policy cost limits",
    date: "May 21, 2026",
    dateRaw: "2026-05-21",
    description:
      "Configure max_cost_minor and allowed action types so purchase-shaped tool calls evaluate before they run.",
    readTime: "8 min read",
    tags: ["Launch", "Integrations"],
    content: `
# Cap agent purchases with action policy cost limits

Agents that book travel or buy SaaS can exceed budget in a single tool call. Cap purchase-shaped actions with \`ActionPolicy\` before the tool runs.

## Define the procurement policy

- Allow only the purchase-shaped types you intend (\`http_post\`, or your adapter's purchase type).
- Set \`max_cost_minor\` so a single booking cannot exceed your ceiling (for example $600.00 → \`60000\`).
- Deny everything else, or park high-risk types as \`approval_required\`.

\`\`\`typescript
import { createSlimActionPolicy } from "@limetry/sdk"

const policy = createSlimActionPolicy({
  allowedTypes: ["http_post"],
  maxCostMinor: 60000,
  requireApprovalActionTypes: ["http_post"],
  auditMode: "minimal",
})
\`\`\`

If the agent proposes a $1,200 purchase, evaluate returns deny (or \`approval_required\` when configured) before the tool runs.

Run evaluate with the self-run server or SDK locally. See the [quick start](/docs/quick-start).

See the [OpenAI procurement example](/examples/openai).
`,
  },
  {
    slug: "2026-05-serverless-aws-cost-control",
    title: "Enforce cloud budget limits for Slack bot agents",
    date: "May 31, 2026",
    dateRaw: "2026-05-31",
    description:
      "Call evaluate inside the handler before the scale API so channel budget policy can deny oversized cloud upgrades.",
    readTime: "7 min read",
    tags: ["Integrations", "Security"],
    content: `
# Enforce cloud budget limits for Slack bot agents

Slack bots that scale cloud spend from chat introduce cost and compromise risk. Call evaluate inside the handler before the scale API so channel budget policy must allow the cost first.

## Wire evaluate into the handler path

1. **Slack command**: A developer runs \`/aws scale database db.r5.12xlarge\`.
2. **Handler trigger**: Slack invokes the handler.
3. **Build the intent**: Parse the request, map the instance tier to an estimated hourly cost, and submit evaluate to Limetry.
4. **Enforce the decision**: If cost exceeds the channel budget (for example max $100/hr), Limetry denies and Slack returns an authorization error.

Even if Slack is compromised, the scale API still waits on an allow decision and a privacy-safe audit record.

Deploy with the [Slack bot example](/examples/slack). Point evaluate at your self-run Limetry server — see [self-run setup](/docs/server/self-run setup).
`,
  },
  {
    slug: "2026-06-json-rpc-multisig-marketplace",
    title: "Coordinate multi-agent marketplaces with shared action policy",
    date: "June 2, 2026",
    dateRaw: "2026-06-02",
    description:
      "Evaluate each sensitive request as an ActionIntent against shared marketplace policy and privacy-safe audit—without holding funds.",
    readTime: "9 min read",
    tags: ["Engineering", "Security"],
    content: `
# Coordinate multi-agent marketplaces with shared action policy

In a multi-agent marketplace, one agent may buy work from another — for example a travel agent purchasing a weather micro-forecast. Treat each sensitive request as an \`ActionIntent\`: evaluate against shared marketplace policy, write a privacy-safe audit trail, then allow or deny. Do not hold funds on behalf of agents for this.

## Apply shared policy before side effects

1. The buying agent drafts an intent (action type, resource, optional cost).
2. Coordinators submit the intent to Limetry for server-authoritative evaluation.
3. Velocity, allowlists, and pending-intent limits apply across collaborating agents.
4. An allow decision (optionally with a verified receipt) lets middleware run the tool; settlement stays on your rails.

Policy and privacy-safe telemetry come first. Payment rails remain optional and separate.

Inspect the TypeScript coordinator in the [multi-agent marketplace example](/examples/marketplace).
`,
  },
  {
    slug: "2026-06-mcp-integration",
    title: "Configure the Limetry MCP server",
    date: "June 11, 2026",
    dateRaw: "2026-06-11",
    description:
      "Register @limetry/mcp so Claude, Cursor, and Copilot can call evaluate, record, audit, and policy tools.",
    readTime: "5 min read",
    tags: ["MCP", "Integrations"],
    content: `
# Configure the Limetry MCP server

\`@limetry/mcp\` exposes evaluate, record, audit, and policy tools to MCP hosts such as Claude Desktop, Cursor, and GitHub Copilot. Evaluate and audit sensitive agent actions from the editor without embedding credentials in prompts.

## Register the server

Add this block to Claude Desktop or Cursor MCP config:

\`\`\`json
{
  "mcpServers": {
    "limetry": {
      "command": "npx",
      "args": ["-y", "@limetry/mcp"],
      "env": {
        "LIMETRY_API_KEY": "sk-your-bearer-token",
        "LIMETRY_BASE_URL": "http://localhost:3810"
      }
    }
  }
}
\`\`\`

Point \`LIMETRY_BASE_URL\` at your self-run evaluation server (see [self-run setup](/docs/server/self-run setup)).

## Call the tools

Once registered, the IDE agent can call \`limetry_evaluate\`, \`limetry_record_action\`, \`limetry_list_audit\`, and \`limetry_upsert_policy\`. Attempt a blocked action (for example \`http_post\` to a production URL) and confirm deny plus a privacy-safe audit record. Do not put secrets in \`metadata\`/\`details\`.

Until \`@limetry/mcp\` is on npm, run the built binary from a source checkout.
`,
  },
  {
    slug: "2026-06-custom-gemini-agent-skills",
    title: "Require evaluate in Gemini and Antigravity skills",
    date: "June 28, 2026",
    dateRaw: "2026-06-28",
    description:
      "Add a workspace skill that instructs the assistant to run Limetry evaluate before paid-platform side effects.",
    readTime: "6 min read",
    tags: ["SDK", "Integrations"],
    content: `
# Require evaluate in Gemini and Antigravity skills

Antigravity and similar assistants load skills — folders of instructions and helper scripts — for specialized workflows. If those skills can touch paid platforms (cloud consoles, package registries, domain registrars), require evaluate before side effects.

## Define the skill

Create \`skills/action-governance/SKILL.md\`:

\`\`\`markdown
---
name: action-governance
description: Evaluate and audit sensitive agent tool calls
---

Ensure sensitive tool calls evaluate through Limetry (CLI, MCP, or SDK) before side effects.
\`\`\`

Put that requirement in the skill instructions so the assistant evaluates before it writes or runs execution scripts.

See [Antigravity customization](/docs/introduction) for local workspace skill layout.
`,
  },
  {
    slug: "2026-07-shopify-mutation-firewall",
    title: "Gate Shopify Admin mutations for AI support agents",
    date: "July 25, 2026",
    dateRaw: "2026-07-25",
    description:
      "Hold SHOPIFY_ADMIN_TOKEN in @limetry/shopify, evaluate refund, discount, and inventory intents, and proxy to Shopify only on allow.",
    readTime: "9 min read",
    tags: ["Use Cases", "Shopify"],
    content: `
# Gate Shopify Admin mutations for AI support agents

A design partner's support agent issued fourteen refunds totaling $3,200 in under two minutes. Every refund was a valid Admin API call. Nobody with authority approved the batch. Shopify settled each one. Limetry was not in the path.

The agent was not malicious. The missing control was \`approval_required\` before Shopify received a mutation.

## Keep the Admin token out of the agent

Useful support agents need write scopes. Once the agent holds the Admin token, every refund, discount, and inventory write is one tool call away.

Per-request logic can look correct while aggregate risk is unguarded: retries, prompt injection, or a burst of legitimate returns. Prompt instructions are advisory. They are not evaluate.

## Prefer a runtime gate over prompt rules

"Only process refunds under $25" in the system prompt is not an \`evaluate\`. A long thread or malformed tool-call JSON can ignore it, and you still lack an allow/deny/\`approval_required\` row you can query. Put the gate in the process that holds the Admin token: evaluate first, then maybe proxy to Shopify.

## Install @limetry/shopify in the agent runtime

This is not a Shopify App Store install. Merchants keep the Admin token in their backend. \`@limetry/shopify\` (open source) owns \`SHOPIFY_ADMIN_TOKEN\`. The agent never sees the raw token. It calls \`firewall.createRefund({ orderId, amountMinor })\`. The firewall evaluates an \`ActionIntent\` and proxies to Shopify only on \`allow\`.

\`\`\`typescript
import { ShopifyActionFirewall } from "@limetry/shopify"

const firewall = new ShopifyActionFirewall({
  shopDomain: "acme.myshopify.com",
  adminToken: process.env.SHOPIFY_ADMIN_TOKEN!,
  apiKey: process.env.LIMETRY_API_KEY!,
  policyId: process.env.LIMETRY_POLICY_ID!,
  dryRun: true,
})

const result = await firewall.createRefund({
  orderId: "5678",
  amountMinor: 2500, // $25.00
})
\`\`\`

Store policy on your self-run Limetry server. Declare allowed types (\`shopify.refund\`, \`shopify.discount\`), maximum cost per intent, and which types park as \`approval_required\`. The demo policy in \`packages/shopify/policies/refunds.json\` is deny-only for demonstration; \`createShopifyActionPolicy\` adds refund approval via \`require_approval_action_types\`.

## Handle allow, deny, and approval_required

1. **allow** — the mutation may proceed. With decision signing configured, the decision carries a signed receipt for downstream verification.
2. **deny** — hard stop with structured reasons. The agent can report that store policy blocked the action.
3. **approval_required** — parked until an operator approves via \`POST /v1/approvals/:id/approve\` with the same intent payload hash. The agent retries after \`allow\`.

Shopify action types (\`shopify.refund\`, \`shopify.inventory\`, \`shopify.discount\`) use the same \`ActionIntent\` contract as the rest of Limetry.

## Query privacy-safe audit

Every evaluate writes a privacy-safe audit trail (\`minimal\` by default): action type, cost field, decision, timestamp, tenant — not raw customer payloads, card data, or chat. Answer "how many refunds did the agent attempt, and what did policy do?" from audit, not from Shopify payout reports.

## Operational notes

**Start with dryRun.** Run \`dryRun: true\` and inspect audit until classifications match production traffic, then set \`dryRun: false\`.

**Treat inventory separately.** Setting inventory to zero looks like a normal stock adjustment at the API level. Define \`shopify.inventory\` as its own action type and choose deny or \`approval_required\` per merchant.

**Hold the token; evaluate before Shopify sees the mutation.** The fourteen refunds were valid Admin API calls. What was missing was deny for the batch, \`approval_required\` for the manager, and an audit row finance could open before settlement.

## Where it ships

\`@limetry/shopify\` is open source in the [Limetry repository](${siteUrls.github}). CI starts a Limetry node, applies a policy, and runs three evaluations (allow a small refund, deny a large one, deny an inventory wipe) without a live Shopify store. For production, set \`SHOPIFY_ADMIN_TOKEN\` and \`dryRun: false\`. Point evaluate at your self-run server and use the approval API for operator approvals.

Related: [When fourteen refunds settle before coffee](/blog/2026-09-fourteen-refunds) and [Dry-run week](/blog/2026-09-shopify-dryrun-week).
`,
  },
  {
    slug: "2026-08-ci-gate-github-actions",
    title: "Evaluate before CI loads credentials",
    date: "August 5, 2026",
    dateRaw: "2026-08-05",
    description:
      "Use @limetry/ci to evaluate ci_privilege and deploy intents before workflows load secrets or production credentials.",
    readTime: "10 min read",
    tags: ["Use Cases", "CI"],
    content: `
# Evaluate before CI loads credentials

A fork pull request shared a job with \`configure-cloud-credentials\`. Nobody had stolen anything — the PR was a typo fix. GitHub already withholds secrets from \`pull_request\` on forks. That was not the hole. The workflow mixed untrusted checkout with a credential step (\`pull_request_target\` / same job as tests). If the next PR had been worse, production credentials could have been minted where untrusted code ran. The gap was evaluate-shaped, not a breach.

## Separate untrusted work from credentials

Teams mix untrusted work and credential work in one workflow, enable \`pull_request_target\` because tests "need secrets," or load production credentials before classifying the trigger. GitHub's primitives are repo- and environment-level. They are not an \`evaluate\` of \`ci_privilege\` vs \`deploy\`.

Coding agents make the typo-PR shape ordinary. Without evaluate *before* secrets, a confused agent can hammer a \`deploy\` path that should have been \`deny\` or \`approval_required\`.

## Evaluate before secrets, production credentials, or prod credentials

Carry \`owner/repo@sha\`, the GitHub event name, and the action type (\`ci_privilege\` for tests/lint, \`deploy\` for production publish). Policy returns \`allow\`, \`deny\`, or \`approval_required\`. On \`approval_required\`, fail closed until an operator approves.

\`\`\`yaml
- uses: limetry/limetry/packages/ci@main
  with:
    limetry_api_key: \${{ secrets.LIMETRY_API_KEY }}
    limetry_base_url: \${{ vars.LIMETRY_BASE_URL }}
    policy_id: \${{ vars.LIMETRY_CI_POLICY_ID }}
    action_type: deploy
    require_trusted: "true"
\`\`\`

If the event is \`pull_request\` (untrusted) and \`require_trusted\` is set, the step fails immediately — before \`configure-cloud-credentials\` or \`docker login\`. The failing step produces a structured error: "action_type deploy is denied; event pull_request is not trusted."

## Split ci-privilege and deploy policies

1. **ci-privilege.json** — allows \`ci_privilege\` (tests, typecheck, lint). Denies \`deploy\`. Used in the quality-gate workflow every PR triggers.
2. **deploy.json** — allows \`ci_privilege\` and \`deploy\`. Only reached by workflows that require a trusted event (\`push\` to main, \`release\`, or \`workflow_dispatch\`).

PRs evaluate one intent and pass. Production deploy requires both a trusted trigger and an explicit policy allow.

## Classify GitHub events

\`@limetry/ci\` classifies events against an explicit trusted allowlist:

- **Trusted:** \`push\`, \`release\`, \`workflow_dispatch\`
- **Untrusted (named):** \`pull_request\`, \`pull_request_target\`, \`pull_request_review\`, \`pull_request_review_comment\`, \`issues\`, \`issue_comment\`, \`workflow_run\`
- **Everything else,** including \`schedule\` and future events: untrusted by default. A \`ref\` of \`refs/pull/*\` is also untrusted regardless of event name.

\`require_trusted: true\` on a \`deploy\` step fails the job before \`configure-cloud-credentials\`.

## Use the composite action or the library

\`@limetry/ci\` (open source) ships as a GitHub composite action and a TypeScript library. The composite action can boot a local Limetry node in the job, apply policy JSON, and evaluate. The library exposes \`evaluateCiPrivilege()\` for custom scripts or a remote self-run evaluate endpoint.

\`\`\`typescript
import { evaluateCiPrivilege } from "@limetry/ci"

const result = await evaluateCiPrivilege({
  apiKey: process.env.LIMETRY_API_KEY!,
  policyId: process.env.LIMETRY_POLICY_ID!,
  agentId: "github_actions",
  actionType: "deploy",
  repository: "acme/api",
  sha: process.env.GITHUB_SHA!,
  eventName: "push",
})

if (result.evaluation.decision === "deny" || result.trust === "untrusted") {
  process.exit(1)
}
\`\`\`

## Lessons from dogfooding

We run \`@limetry/ci\` on the Limetry monorepo. Quality-gate evaluates \`ci_privilege\` (must allow) and \`deploy\` (must deny). Deploy evaluates \`deploy\` with \`require_trusted: true\` before cloud deploy credentials load.

**Keep the gate fast.** Starting a Limetry node inside the job adds seconds. Build the server before the gate step, or point \`limetry_base_url\` at a standing self-run evaluate endpoint to avoid local node startup.

**Write clear failure messages.** Contributors should see: "Limetry denied action_type=deploy because event=pull_request is untrusted."

**Stage before required checks.** Run as a non-required job, read decisions from audit, then make the check required at the branch-protection layer. The action still fails the step on \`deny\`.

Branch protection and environment rules remain. Limetry is the evaluate layer on top: allow \`ci_privilege\` on any event, but \`deploy\` needs a trusted event *and* policy \`allow\`, with privacy-safe audit across repos.

Related: [The Copilot PR burst that nearly shipped to prod](/blog/2026-09-copilot-pr-burst) and [Staging the CI gate](/blog/2026-09-staging-ci-gate).
`,
  },
  {
    slug: "2026-08-sql-write-gate",
    title: "Gate SQL writes so agents never hold DATABASE_URL",
    date: "August 14, 2026",
    dateRaw: "2026-08-14",
    description:
      "Use @limetry/sql to classify, evaluate, and execute SQL statements while keeping DATABASE_URL out of the agent.",
    readTime: "9 min read",
    tags: ["Use Cases", "SQL"],
    content: `
# Gate SQL writes so agents never hold DATABASE_URL

A developer using Cursor asked Claude to "clean up the test data" in production. Claude ran \`DELETE FROM users WHERE email LIKE '%+test%'\`. The predicate matched 1,847 production accounts. Production \`DATABASE_URL\` was in the MCP config because it was the only connection string on hand.

The model can recite that \`DELETE\` is dangerous. The root cause was architectural: the agent held \`DATABASE_URL\`. Nothing in the path was an \`evaluate\`.

## Fix credential ownership

Default DB MCP: the host holds a connection string, and the model chooses SQL. Prompt text that says "this is production" is advisory. The driver still runs the statement.

A read-only URL works until someone needs an \`INSERT\`, a status update, or a migration. Then the choice becomes: hand over write credentials and hope, or remove the tool. Prefer a third path: the gate owns \`DATABASE_URL\`, classifies, evaluates \`sql.read\` / \`sql.write\` / \`sql.ddl\`, and executes only on \`allow\`.

## Configure @limetry/sql

\`@limetry/sql\` (open source) owns \`DATABASE_URL\`. The agent never receives the raw connection string. It gets \`limetry_sql_query\`. On each statement the gate:

1. **Classifies** with a conservative keyword heuristic — \`read\`, \`write\`, \`ddl\`, or \`unknown\`. Unknown maps to \`sql.write\` (over-gate rather than unguarded write).
2. **Evaluates** an \`ActionIntent\` with \`action_type: "sql.read"\`, \`"sql.write"\`, or \`"sql.ddl"\`.
3. **Decides**: allow (execute and return results), deny (structured error), or \`approval_required\` (park until operator signs off).

\`\`\`json
{
  "mcpServers": {
    "limetry-sql": {
      "command": "npx",
      "args": ["-y", "@limetry/sql"],
      "env": {
        "DATABASE_URL": "postgresql://...",
        "LIMETRY_API_KEY": "...",
        "LIMETRY_POLICY_ID": "...",
        "LIMETRY_BASE_URL": "http://localhost:3810"
      }
    }
  }
}
\`\`\`

The agent sees results from allowed reads and clear errors from denied writes. It never sees \`DATABASE_URL\`. Point \`LIMETRY_BASE_URL\` at your self-run Limetry server.

## Keep classification conservative

This is a heuristic, not a full SQL parser. Dialects, extensions, and CTEs that wrap writes will outrun one. Map \`INSERT\` / \`UPDATE\` / \`DELETE\` / \`DROP\` / \`ALTER\` / \`TRUNCATE\` / \`CREATE\` / \`GRANT\` to write or DDL; unknown → \`sql.write\`; else read. Over-gating costs seconds. Under-gating deletes rows.

## Park writes with approval_required

Reads can \`allow\`. A production \`DELETE\` should \`deny\` or park. Needed \`INSERT\` / bounded \`UPDATE\` can return \`approval_required\`: the agent gets a structured wait state; the operator uses \`limetry_sql_list_pending\` or the approval API, then approves or rejects. Shipped \`policies/postgres.json\` is read-only — add \`require_approval_action_types\` to enable parked writes.

## Point at your SQL database

Set \`DATABASE_URL\` to any SQL connection string your team trusts. Same classify → evaluate → allow/deny/\`approval_required\`.

## Run dry-run before enforcement

Dry-run is the default (\`LIMETRY_SQL_DRY_RUN\` on unless set to \`"false"\`). Classify and evaluate without executing. Inspect audit, confirm SELECT allows and DDL denies, then set \`LIMETRY_SQL_DRY_RUN=false\`. Removing the variable keeps dry-run; it does not enable execution.

## Store privacy-safe SQL audit

Audit (\`minimal\` by default) keeps \`sql.read\` / \`sql.write\` / \`sql.ddl\`, decision, timestamp, and enough statement shape to review — not full SQL at rest. A 200-character \`sql_preview\` in intent metadata is truncation, not redaction. Answer "was this a denied write?" without turning audit into a replayable log of predicates and values.

## Operational notes

With the gate, that cleanup classifies as \`sql.write\`, evaluate returns \`deny\`, and The database never sees it. Agents retry; without the gate, speculative writes hit prod. Do not put \`DATABASE_URL\` in agent-visible MCP env.

CI starts a SQL service and a Limetry node: \`SELECT\` must \`allow\` and execute; \`DROP\` and \`DELETE\` must \`deny\` before the driver.

Related: [The DELETE that erased 1,847 accounts](/blog/2026-09-delete-erased-accounts) and [Adding write access without giving away the keys](/blog/2026-09-sql-write-access).
`,
  },
  {
    slug: "2026-09-copilot-pr-burst",
    title: "Deny deploy on a Copilot PR burst before production credentials",
    date: "September 3, 2026",
    dateRaw: "2026-09-03",
    description:
      "Twelve Copilot PRs hit pull_request_target beside configure-cloud-credentials. Evaluate denied deploy before production credentials minted.",
    readTime: "11 min read",
    tags: ["Use Cases", "CI"],
    content: `
# Deny deploy on a Copilot PR burst before production credentials

Copilot opened twelve pull requests in twenty minutes: import cleanup, build-cache tweak, fixture rename, mechanical TypeScript edits. Each PR triggered the same workflow. A \`pull_request_target\` job shared a path with \`aws-actions/configure-cloud-credentials\`: checkout of PR code for tests, then a deploy step that assumed production credentials only minted on trusted code.

GitHub withholds secrets from fork \`pull_request\` runs. That was not this hole. \`pull_request_target\` runs in the base-repo context. Untrusted checkout and credential minting sat in one job. No attacker opened a PR — a coding agent did, twelve times.

## Gate volume from helpful loops

The failure mode is cloud credentials in the wrong execution context. Branch protection and environment reviewers still matter; they run later. They do not classify \`pull_request_target\` as untrusted for \`deploy\`, and they do not write an evaluate row you can query after the burst.

Target: 12 PRs → 12 test intents \`allow\`, 12 deploy intents \`deny\` before credentials load.

## Split policies and evaluate before production credentials

\`@limetry/ci\` uses two lanes:

1. \`ci-privilege.json\` allows \`ci_privilege\` for tests and denies \`deploy\`.
2. \`deploy.json\` allows \`deploy\`, but the job still requires a trusted GitHub event.

Classify the event, then evaluate. Trusted: \`push\`, \`release\`, \`workflow_dispatch\`. Untrusted: \`pull_request\`, \`pull_request_target\`, review events, issues, \`workflow_run\`, \`refs/pull/*\`. Unknown future events — including \`schedule\` — are untrusted by default.

Evaluate still runs on the untrusted path so deny is a recorded decision. \`require_trusted: true\` fails the step after evaluate when trust is untrusted, so \`configure-cloud-credentials\` never runs.

\`\`\`typescript
import { evaluateCiPrivilege } from "@limetry/ci"

const deployResult = await evaluateCiPrivilege({
  apiKey: process.env.LIMETRY_API_KEY!,
  baseUrl: process.env.LIMETRY_BASE_URL,
  policyId: process.env.LIMETRY_DEPLOY_POLICY_ID!,
  agentId: "github_actions",
  actionType: "deploy",
  repository: "acme/api",
  sha: process.env.GITHUB_SHA!,
  eventName: process.env.GITHUB_EVENT_NAME!,
  ref: process.env.GITHUB_REF,
})

if (deployResult.trust === "untrusted" || deployResult.evaluation.decision !== "allow") {
  throw new Error(
    [
      "Limetry denied deploy",
      \`trust=\${deployResult.trust}\`,
      \`decision=\${deployResult.evaluation.decision ?? "deny"}\`,
    ].join(" "),
  )
}
\`\`\`

Place this step before credential loading. GitHub environment rules still apply after. Ask first: should this action type run from this event at this SHA?

## Deny on the PR; park approval on main

Typical PR deploy receipt against \`ci-privilege.json\`:

\`\`\`json
{
  "intent": {
    "agent_id": "github_actions",
    "action_type": "deploy",
    "resource": "acme/api@9f4c2b1",
    "metadata": {
      "event_name": "pull_request_target",
      "trust": "untrusted"
    }
  },
  "decision": "deny",
  "reasons": [
    "action_type deploy is denied"
  ]
}
\`\`\`

Test lane: \`allow\` for \`ci_privilege\`. Deploy lane: \`deny\` for every PR. Trust stays \`untrusted\`. Tests keep running. The job never reaches \`configure-cloud-credentials\`.

After merge, main-branch deploy under the deploy policy may return \`approval_required\`. Fail closed with an \`approval_id\`. Approve via the approval API (operator approval). Retry until \`allow\` with a signed receipt (\`digest\`, \`exp\`, \`sig\`) that \`verifyReleaseReceipt\` can bind to the intent. Only then run \`configure-cloud-credentials\`.

## Results from the burst

- 12 PRs evaluated in less than one second each (self-run evaluate).
- 12 test lanes returned \`allow\`.
- 12 deploy lanes returned \`deny\` before production credentials loaded.
- 1 main-branch deploy parked as \`approval_required\` until a team lead approved.

Audit answers which agent asked for deploy, from which SHA, on which event, and why policy stopped it. The release still shipped. Untrusted PRs never touched credentials.

Origin: [Evaluate before CI loads credentials](/blog/2026-08-ci-gate-github-actions). Rollout: [Staging the CI gate](/blog/2026-09-staging-ci-gate).
`,
  },
  {
    slug: "2026-09-staging-ci-gate",
    title: "Stage the CI gate from non-required to required",
    date: "September 5, 2026",
    dateRaw: "2026-09-05",
    description:
      "Run evaluate as a non-required job for one week, verify classifications in audit, then make the check required.",
    readTime: "10 min read",
    tags: ["Use Cases", "CI"],
    content: `
# Stage the CI gate from non-required to required

A required check with a confusing red X loses contributors. Platform may want the gate required on day one. Maintainers who live in contributor Slack want proof it will not punish ordinary PRs. Stage with real traffic before branch protection blocks merges.

## Run one week as a non-required job

Evaluate real intents and write audit rows. Do not block merges on the result yet. The step can still fail on \`deny\` inside the job; staging lives at the branch-protection layer, not inside \`@limetry/ci\`.

The action always records the decision. Whether GitHub treats the job as blocking is a separate, reversible choice.

\`\`\`typescript
import { evaluateCiPrivilege } from "@limetry/ci"

const result = await evaluateCiPrivilege({
  apiKey: process.env.LIMETRY_API_KEY!,
  baseUrl: process.env.LIMETRY_BASE_URL,
  policyId: process.env.LIMETRY_CI_POLICY_ID!,
  agentId: "github_actions",
  actionType: "deploy",
  repository: process.env.GITHUB_REPOSITORY!,
  sha: process.env.GITHUB_SHA!,
  eventName: process.env.GITHUB_EVENT_NAME!,
  ref: process.env.GITHUB_REF,
})

process.stdout.write(JSON.stringify({
  action_type: result.intent.action_type,
  trust: result.trust,
  decision: result.evaluation.decision,
  reasons: result.evaluation.reasons ?? [],
  decision_id: result.evaluation.decision_id,
}, null, 2))
\`\`\`

Review audit daily for two failure modes: trusted main runs denied, and untrusted PR runs allowed into deploy. Fix contributor-facing annotations before the check becomes required.

## Verify classifications before requiring the check

Example after seven days (184 CI evaluations):

\`\`\`text
ci_privilege on pull_request:        91 allow
deploy on pull_request:              91 deny
deploy on push to main:               2 approval_required
false classifications:                0
median evaluate latency:           142 ms
highest evaluate latency:          611 ms
\`\`\`

Update failure text before requiring the check. After evaluate, \`require_trusted\` fails closed on untrusted events with a named event and resource:

\`\`\`text
Refusing privileged CI for untrusted event pull_request on acme/api@f3a91c2
\`\`\`

Audit still carries the policy deny, \`decision_id\`, receipt digest, reasons, and expiry.

## Make the check required

After staging evidence is clean, require the check. Cost: one extra evaluate call per sensitive job. Return: audit across protected workflows and a check GitHub will block on. Environment rules stay. Limetry remains the first question in the job: should this action type run from this event at this SHA?

Origin: [Evaluate before CI loads credentials](/blog/2026-08-ci-gate-github-actions). Incident context: [Deny deploy on a Copilot PR burst before production credentials](/blog/2026-09-copilot-pr-burst).
`,
  },
  {
    slug: "2026-09-fourteen-refunds",
    title: "Stop a fourteen-refund batch before Shopify settles",
    date: "September 10, 2026",
    dateRaw: "2026-09-10",
    description:
      "With @limetry/shopify in path: small refunds allow, larger ones park for approval, duplicates never hit Shopify.",
    readTime: "11 min read",
    tags: ["Use Cases", "Shopify"],
    content: `
# Stop a fourteen-refund batch before Shopify settles

Fourteen refunds, $3,200, settled in two minutes. Every Admin API call was valid. Every customer had asked. Nobody with authority had seen the queue as a queue. Prompt text that said "ask before large refunds" was not an \`evaluate\`.

## Separate courtesy refunds from manager-gated amounts

A $10 courtesy refund should not wait for a human. A $250 refund may be legitimate and still need a manager. An inventory wipe should not share the same support tool path.

In that batch: four refunds under $25; ten above the approval threshold; four of those ten were duplicates from retries. Without a runtime gate, all fourteen settled. Finance saw the total, not which four should never have gone out.

Backstory: [Gate Shopify Admin mutations for AI support agents](/blog/2026-07-shopify-mutation-firewall).

## Call the firewall, not Shopify

\`@limetry/shopify\` keeps \`SHOPIFY_ADMIN_TOKEN\` in the merchant runtime. The agent calls the firewall. The firewall builds an \`ActionIntent\`, evaluates, and proxies the Admin API mutation only on \`allow\`.

\`\`\`typescript
import { ShopifyActionFirewall } from "@limetry/shopify"

const firewall = new ShopifyActionFirewall({
  shopDomain: "acme.myshopify.com",
  adminToken: process.env.SHOPIFY_ADMIN_TOKEN!,
  apiKey: process.env.LIMETRY_API_KEY!,
  baseUrl: process.env.LIMETRY_BASE_URL,
  policyId: process.env.LIMETRY_SHOPIFY_POLICY_ID!,
  dryRun: false,
})

const result = await firewall.createRefund({
  orderId: "5839201741",
  amountMinor: 2500,
  currency: "USD",
})

if (result.evaluation.decision !== "allow") {
  process.stdout.write(JSON.stringify({
    executed: result.executed,
    decision: result.evaluation.decision,
    approval_id: result.evaluation.approval_id,
    reasons: result.evaluation.reasons ?? [],
  }, null, 2))
}
\`\`\`

Example operating policy: allow refunds and discounts; deny inventory; park refunds at or above $25 as \`approval_required\`. No hard \`max_cost_minor\` on refunds — the manager is the ceiling — so a $250 refund parks instead of hard-denying. Approvals use the approval API for operator approval.

## Map outcomes by amount and type

\`\`\`json
{
  "allowed_action_types": ["shopify.refund", "shopify.discount"],
  "denied_action_types": ["shopify.inventory"],
  "require_approval_action_types": ["shopify.refund"],
  "approval_cost_minor": 2500,
  "currency": "USD",
  "audit_mode": "minimal"
}
\`\`\`

- $10 refund → \`allow\`; firewall executes.
- $25+ refund → \`approval_required\` with \`approval_id\`; \`executed\` stays false.
- Inventory set-to-zero → \`deny\`; Shopify never sees the wipe.

With decision signing configured, an allow includes a receipt bound to the evaluated intent digest.

## Counterfactual on the original batch

- 4 refunds under $25 → \`allow\`.
- 10 refunds → \`approval_required\`.
- Manager approves 6, rejects 4 duplicates.
- Four rejected duplicates ≈ $1,600 that stays in the merchant account.

Support keeps the agent. The Admin token stays behind the policy gate. Audit is decisions, not a spreadsheet after settlement.

Confidence ladder: [Dry-run week](/blog/2026-09-shopify-dryrun-week).
`,
  },
  {
    slug: "2026-09-shopify-dryrun-week",
    title: "Shadow-evaluate Shopify mutations before enforcement",
    date: "September 12, 2026",
    dateRaw: "2026-09-12",
    description:
      "Run dryRun for a week on live traffic, confirm zero false denies, then move the Admin token behind the firewall.",
    readTime: "10 min read",
    tags: ["Use Cases", "Shopify"],
    content: `
# Shadow-evaluate Shopify mutations before enforcement

A false allow repeats an unauthorized refund batch. A false deny damages support. Validate decision accuracy on live refund, discount, and inventory intents before cutover.

## Shadow evaluate, then move the token

\`ShopifyActionFirewall\` defaults to \`dryRun: true\`. Evaluate still runs and writes audit. \`executed\` stays false even on \`allow\`, so the firewall does not proxy to Shopify.

Do not cut the token over first. For one week, keep the existing support path executing mutations while the agent also calls the firewall with \`dryRun: true\`. Customer outcomes do not change. Audit fills with what policy would have done.

\`\`\`typescript
import { ShopifyActionFirewall } from "@limetry/shopify"

const firewall = new ShopifyActionFirewall({
  shopDomain: "acme.myshopify.com",
  adminToken: process.env.SHOPIFY_ADMIN_TOKEN!,
  apiKey: process.env.LIMETRY_API_KEY!,
  baseUrl: process.env.LIMETRY_BASE_URL,
  policyId: process.env.LIMETRY_SHOPIFY_POLICY_ID!,
  dryRun: true,
})

const result = await firewall.createRefund({
  orderId: "5839201741",
  amountMinor: 8800,
  currency: "USD",
})

process.stdout.write(JSON.stringify({
  action_type: result.intent.action_type,
  amount_minor: result.intent.cost?.amount_minor,
  decision: result.evaluation.decision,
  dry_run: result.dryRun,
  executed: result.executed,
  decision_id: result.evaluation.decision_id,
}, null, 2))
\`\`\`

Review every denied or parked refund with support leads. Tune policy (action type, amount threshold, inventory deny) — not the prompt.

## Confirm accuracy before cutover

Example dry-run week:

\`\`\`text
shopify.refund under $25:        126 allow
shopify.refund $25 and higher:    18 approval_required
shopify.inventory:                 3 deny
false denies:                      0
true deny examples:                3 attempted inventory wipes
median evaluate latency:        168 ms
\`\`\`

Zero false denies on refunds, parked amounts the leads agree should wait, and inventory attempts that should never live in a support agent are the cutover signal.

## Enable enforcement

Set \`dryRun\` to \`false\` and remove the parallel Shopify client. Keep the Admin token only in the firewall. Park higher refunds as \`approval_required\` for operator approval via the approval API.

Related: [Stop a fourteen-refund batch before Shopify settles](/blog/2026-09-fourteen-refunds). Origin: [Gate Shopify Admin mutations for AI support agents](/blog/2026-07-shopify-mutation-firewall).
`,
  },
  {
    slug: "2026-09-delete-erased-accounts",
    title: "Deny sql.write before the database sees a mass DELETE",
    date: "September 17, 2026",
    dateRaw: "2026-09-17",
    description:
      "Production DATABASE_URL in Cursor MCP plus a bad LIKE predicate. @limetry/sql denies sql.write before the database executes.",
    readTime: "11 min read",
    tags: ["Use Cases", "SQL"],
    content: `
# Deny sql.write before the database sees a mass DELETE

Cursor MCP pointed at production. Claude ran:

\`\`\`sql
DELETE FROM users WHERE email LIKE '%+test%'
\`\`\`

The predicate matched 1,847 production accounts. Point-in-time recovery was not configured. Prompt instructions were advisory. The driver still ran the statement.

Origin: [Gate SQL writes so agents never hold DATABASE_URL](/blog/2026-08-sql-write-gate).

## Fix credential ownership

Once the agent holds \`DATABASE_URL\`, every session is a write session. Blocking every query kills the workflow. Giving write credentials repeats the failure. Prefer: gate owns the URL; classify; evaluate; execute only on \`allow\`.

## Hold DATABASE_URL in the gate

\`@limetry/sql\` moves \`DATABASE_URL\` into the gate process. The agent gets \`limetry_sql_query\`. Unknown classification maps to \`sql.write\` on purpose.

\`\`\`typescript
import { SqlActionGate } from "@limetry/sql"

const gate = new SqlActionGate({
  connectionString: process.env.DATABASE_URL!,
  apiKey: process.env.LIMETRY_API_KEY!,
  baseUrl: process.env.LIMETRY_BASE_URL,
  policyId: process.env.LIMETRY_SQL_POLICY_ID!,
  agentId: "sql_mcp",
  resourceLabel: "postgres://production",
  dryRun: false,
})

const result = await gate.evaluateAndMaybeExecute({
  sql: "DELETE FROM users WHERE email LIKE '%+test%'",
  execute: true,
})

process.stdout.write(JSON.stringify({
  sql_class: result.sqlClass,
  action_type: result.intent.action_type,
  decision: result.evaluation.decision,
  executed: result.executed,
  reasons: result.evaluation.reasons ?? [],
}, null, 2))
\`\`\`

Shipped \`policies/postgres.json\` is read-only: allow \`sql.read\`, deny \`sql.write\` and \`sql.ddl\`. For cleanup that must run later, use an approval-gated write policy — not a prompt, and not a raw URL in MCP config. See [Adding write access without giving away the keys](/blog/2026-09-sql-write-access).

## Record deny before execution

Against the read-only policy:

\`\`\`json
{
  "intent": {
    "agent_id": "sql_mcp",
    "action_type": "sql.write",
    "resource": "postgres://production",
    "metadata": {
      "sql_class": "write",
      "sql_preview": "DELETE FROM users WHERE email LIKE '%+test%'",
      "dry_run": "false"
    }
  },
  "decision": "deny",
  "executed": false,
  "reasons": [
    "action_type sql.write is denied"
  ]
}
\`\`\`

The database never sees the statement. Audit keeps decision shape and a truncated \`sql_preview\` (200 characters). Do not expect a full \`WHERE\` clause at rest.

## Outcome with the gate

- 1,847 account deletes avoided.
- 0 database writes executed.
- 1 audit row with \`action_type=sql.write\`, \`decision=deny\`, truncated preview.
- Recovery work avoided.

Over-gating unusual SQL as \`unknown\` → \`sql.write\` is acceptable. Next step for legitimate cleanup is a write-capable policy with a human on the \`WHERE\` clause — not another paste of \`DATABASE_URL\` into MCP config.

Write path: [Adding write access without giving away the keys](/blog/2026-09-sql-write-access).
`,
  },
  {
    slug: "2026-09-sql-write-access",
    title: "Add approval-gated SQL writes without exposing DATABASE_URL",
    date: "September 19, 2026",
    dateRaw: "2026-09-19",
    description:
      "Allow sql.read, park sql.write for human approval, deny sql.ddl. Agent never sees the connection string.",
    readTime: "10 min read",
    tags: ["Use Cases", "SQL"],
    content: `
# Add approval-gated SQL writes without exposing DATABASE_URL

Read-only gates protect production and create ticket traffic for routine \`INSERT\` / bounded \`UPDATE\` work. Deny-all-writes and allow-all-writes are both wrong. Prefer: reads execute, writes park for approval, schema changes deny.

## Configure approval-gated writes

Keep \`sql.read\` allowed, park \`sql.write\`, deny \`sql.ddl\`. Expose \`limetry_sql_query\` and \`limetry_sql_list_pending\`. The agent still never sees \`DATABASE_URL\`.

\`\`\`typescript
import { SqlActionGate } from "@limetry/sql"

const gate = new SqlActionGate({
  connectionString: process.env.DATABASE_URL!,
  apiKey: process.env.LIMETRY_API_KEY!,
  baseUrl: process.env.LIMETRY_BASE_URL,
  policyId: process.env.LIMETRY_SQL_POLICY_ID!,
  agentId: "sql_mcp",
  resourceLabel: "postgres://analytics",
  dryRun: false,
})

const result = await gate.evaluateAndMaybeExecute({
  sql: "INSERT INTO experiment_results (experiment_id, variant, conversions) VALUES ('exp_42', 'B', 17)",
  execute: true,
})

if (result.evaluation.decision === "approval_required") {
  process.stdout.write(JSON.stringify(gate.listPending(), null, 2))
}
\`\`\`

\`\`\`json
{
  "allowed_action_types": ["sql.read", "sql.write"],
  "denied_action_types": ["sql.ddl"],
  "require_approval_action_types": ["sql.write"],
  "audit_mode": "minimal"
}
\`\`\`

A production \`DELETE\` still classifies as \`sql.write\` and parks — it does not auto-execute. \`DROP TABLE\` is \`sql.ddl\` and still \`deny\`. Approval-gated writes do not create approval-gated schema changes. Operators approve via the approval API.

## Review pending INSERT before retry

First \`INSERT\` returns \`approval_required\`:

\`\`\`json
{
  "sql_class": "write",
  "decision": "approval_required",
  "approval_id": "apr_01j7m2k8",
  "executed": false,
  "reasons": [
    "action_type sql.write requires human approval"
  ]
}
\`\`\`

Open \`limetry_sql_list_pending\`, review the truncated preview, approve, and retry. On retry, Limetry returns \`allow\`, the gate executes, and the decision receipt ties execution to the approved intent. Reject broad \`UPDATE\` / \`DELETE\` shapes; require a narrowed \`WHERE\` and a new park.

## Measure the first enforced week

Example targets:

- 243 read queries allowed and executed.
- 47 write queries returned \`approval_required\`.
- 44 writes approved and retried successfully.
- 3 writes rejected for broad predicates.
- 0 DDL statements executed.

Ticket traffic moves from "run this SQL" to "approve this evaluated intent." Audit shows every write with the approver's identity. The agent gains write access without seeing \`DATABASE_URL\`.

Incident that made read-only the default: [Deny sql.write before the database sees a mass DELETE](/blog/2026-09-delete-erased-accounts). Origin: [Gate SQL writes so agents never hold DATABASE_URL](/blog/2026-08-sql-write-gate).
`,
  },
]
