/**
 * Local ActionPolicy templates for Shopify mutation firewalls.
 */

import { type ActionPolicy,createSlimActionPolicy } from "@limetry/sdk"

/**
 * Local policy template for Shopify mutation firewalls.
 *
 * Allows `shopify.refund`, `shopify.discount`, and `shopify.inventory`.
 * Refunds require approval above a cost threshold; default max refund is 10000 minor units.
 *
 * @param input - Agent and organization ids plus optional refund / policy overrides.
 * @returns A slim ActionPolicy suitable for local or remote registration.
 */
export function createShopifyActionPolicy(input: {
  agentId: string
  organizationId?: string
  maxRefundMinor?: number
  policyId?: string
}): ActionPolicy {
  return createSlimActionPolicy({
    agentId: input.agentId,
    organizationId: input.organizationId,
    policyId: input.policyId,
    allowedActionTypes: [
      "shopify.refund",
      "shopify.discount",
      "shopify.inventory",
    ],
    maxCostMinor: input.maxRefundMinor ?? 10_000,
    currency: "USD",
    requireApprovalActionTypes: ["shopify.refund"],
    approvalCostMinor: Math.min(5_000, input.maxRefundMinor ?? 10_000),
    auditMode: "minimal",
  })
}
