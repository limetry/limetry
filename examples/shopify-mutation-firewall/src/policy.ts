import { type ActionPolicy,createSlimActionPolicy } from "@limetry/sdk"

/**
 * Support / ops agent policy for one Shopify store.
 * $10 goodwill refunds allow. $25+ wait for approval. Over $50 deny.
 * Inventory mutations are denied — this is not a warehouse console.
 */
export const shopifyStorePolicy: ActionPolicy = createSlimActionPolicy({
  policyId: "44444444-4444-4444-8444-444444444444",
  organizationId: "org_acme_retail",
  agentId: "agent_shopify_support",
  allowedActionTypes: ["shopify.refund", "shopify.discount"],
  deniedActionTypes: ["shopify.inventory", "shopify.delete_product", "shopify.payout"],
  allowedResourcePatterns: ["shop:acme-store.myshopify.com/*"],
  blockedResourcePatterns: ["shop:acme-store.myshopify.com/orders/fraud_*"],
  maxCostMinor: 5000,
  approvalCostMinor: 2500,
  currency: "USD",
  auditMode: "minimal",
})
