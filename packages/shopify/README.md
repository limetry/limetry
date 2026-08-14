# `@limetry/shopify`

> [!NOTE]
> **Origin:** A design partner's support agent issued fourteen refunds totaling $3,200 in two
> minutes — each individually valid, none approved by a human. Prompt-level limits are
> advisory, so `@limetry/shopify` holds the Admin token in the runtime and evaluates every
> mutation before Shopify sees it. Limetry evaluates; Shopify still performs the mutation.

Admin API mutation firewall that holds `SHOPIFY_ADMIN_TOKEN` and only refunds, discounts, or
inventory updates after Limetry returns `allow`.

This is a **library in your agent runtime**, not a Shopify App or Admin/Checkout extension.
Merchants do not install Limetry from the Shopify App Store. Your backend (or MCP host) already
holds the Admin token; Limetry decides whether that process may mutate.

## Live demo in this repo

[`.github/workflows/limetry-shopify-gate.yml`](../../.github/workflows/limetry-shopify-gate.yml)
starts a Limetry node in the job, applies [`policies/refunds.json`](policies/refunds.json), then:

1. Evaluates a **$10** `shopify.refund` — must **allow** (dry-run; Admin API is never called).
2. Evaluates a **$500** refund — must **deny** (`max_cost_minor` is $25.00).
3. Evaluates `shopify.inventory` set to 0 — must **deny** (`shopify.inventory` is in `denied_action_types`).

No Shopify Partner app, store, or `SHOPIFY_ADMIN_TOKEN` is required for that check. A later
optional step is a Partner **development store** with a token in GitHub secrets on trusted
`push` only, still using this same firewall with `dryRun: false`.

## Install

```bash
yarn add @limetry/shopify @limetry/sdk
```

## Usage

```ts
import { ShopifyActionFirewall, createShopifyActionPolicy } from "@limetry/shopify"

const firewall = new ShopifyActionFirewall({
  shopDomain: "acme.myshopify.com",
  adminToken: process.env.SHOPIFY_ADMIN_TOKEN!,
  apiKey: process.env.LIMETRY_API_KEY!,
  policyId: process.env.LIMETRY_POLICY_ID!,
  dryRun: true,
})

const result = await firewall.createRefund({
  orderId: "5678",
  amountMinor: 2500,
})

if (result.evaluation.decision === "approval_required") {
  // Pause until POST /v1/approvals/:id/approve with the same intent payload hash
}
```

`createShopifyActionPolicy` ships a broader template: it allows `shopify.inventory` and
routes `shopify.refund` to approval via `require_approval_action_types`. The CI demo policy
(`policies/refunds.json`) is stricter — it denies inventory outright. Pick one deliberately
rather than assuming they match. Approvals resolve through `POST /v1/approvals/:id/approve`
on your Limetry server.

## Apply the repo policy on your evaluation server

```bash
limetry setup
limetry policy apply --file packages/shopify/policies/refunds.json
```
