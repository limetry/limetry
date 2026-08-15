import { ShopifyActionFirewall, type ShopifyMutationResult } from "@limetry/shopify"

import { shopifyStorePolicy } from "./policy.js"

export function createStoreFirewall(options: {
  apiKey: string
  adminToken: string
  baseUrl?: string
  fetch?: typeof globalThis.fetch
  dryRun?: boolean
}): ShopifyActionFirewall {
  return new ShopifyActionFirewall({
    shopDomain: "acme-store.myshopify.com",
    adminToken: options.adminToken,
    apiKey: options.apiKey,
    policyId: shopifyStorePolicy.policy_id,
    agentId: shopifyStorePolicy.agent_id,
    baseUrl: options.baseUrl,
    fetch: options.fetch,
    dryRun: options.dryRun ?? false,
  })
}

export type SupportToolOutcome = {
  success: boolean
  decision: string
  executed: boolean
  reasons: string[]
  approval_id?: string
  mutationResult: ShopifyMutationResult
}

/**
 * High-level AI agent support tool to issue a customer satisfaction refund.
 */
export async function processCustomerRefund(
  firewall: ShopifyActionFirewall,
  orderId: string,
  amountDollars: number,
): Promise<SupportToolOutcome> {
  const amountMinor = Math.round(amountDollars * 100)
  const result = await firewall.createRefund({
    orderId,
    amountMinor,
    currency: "USD",
  })

  const decision = result.evaluation.decision ?? (result.evaluation.approved ? "allow" : "deny")

  return {
    success: decision === "allow",
    decision,
    executed: result.executed,
    reasons: result.evaluation.reasons ?? [],
    approval_id: result.evaluation.approval_id,
    mutationResult: result,
  }
}
