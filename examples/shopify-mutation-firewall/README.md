# Shopify mutation firewall — support / ops agents

This example is a **support or ops agent** that mutates a Shopify store through
`@limetry/shopify`. It is **not** a Shopify App, Admin extension, or Flow automation.

The agent never holds `SHOPIFY_ADMIN_TOKEN`. `ShopifyActionFirewall` evaluates an
an action intent, then calls Admin API only when Limetry returns `allow`.

## Decisions

| Agent tool | Intent | Decision |
| --- | --- | --- |
| `issue_customer_refund` $10 | `shopify.refund` | **allow** — under `approval_cost_minor` ($25) |
| `set_inventory_level` | `shopify.inventory` | **deny** — not in `allowed_action_types` |
| `issue_customer_refund` $25 | `shopify.refund` | **approval_required** — meets `approval_cost_minor` |
| `issue_customer_refund` $150 | `shopify.refund` | **deny** — exceeds `max_cost_minor` ($50) |

Copy [`SKILL.md`](./SKILL.md) into the support agent's instructions. Register
[`SUPPORT_OPS_TOOLS`](./src/support-ops-agent.ts) with OpenAI or Anthropic tool calling.

```typescript
import { createStoreFirewall } from "./src/agent-support.js"
import { dispatchSupportOpsTool } from "./src/support-ops-agent.js"

const firewall = createStoreFirewall({
  apiKey: process.env.LIMETRY_API_KEY!,
  adminToken: process.env.SHOPIFY_ADMIN_TOKEN!,
})

const result = await dispatchSupportOpsTool(firewall, "issue_customer_refund", {
  orderId: "1234",
  amountDollars: 10,
})
```

## Live demo (no Shopify App)

[`.github/workflows/limetry-shopify-gate.yml`](../../.github/workflows/limetry-shopify-gate.yml)
allows a $10 dry-run refund and denies a $500 refund plus an inventory wipe.

## Tests

```bash
yarn workspace @examples/shopify-mutation-firewall test
```
