import {
  type ActionIntent,
  type ActionPolicy,
  createSlimActionPolicy,
  redactActionIntent,
  redactDetails,
} from "@limetry/sdk"

/**
 * Recommended ActionPolicy for deploy/HTTP-style procurement side effects.
 * Prefer this over spend-wallet wrappers when teaching evaluate → deny → audit.
 */
export function buildProcurementActionPolicy(): ActionPolicy {
  return createSlimActionPolicy({
    agentId: "agent_procurement",
    organizationId: "org_demo",
    allowedActionTypes: ["http_post", "purchase", "deploy"],
    blockedResourcePatterns: ["*://prod.internal/*"],
    maxCostMinor: 5000,
    currency: "USD",
    auditMode: "minimal",
  })
}

/**
 * Build an ActionIntent for evaluate. Never put secrets in metadata.
 */
export function buildPurchaseIntent(input: {
  policyId: string
  resource: string
  amountMinor: number
}): ActionIntent {
  return {
    intent_id: `intent-${Date.now()}`,
    policy_id: input.policyId,
    agent_id: "agent_procurement",
    action_type: "purchase",
    resource: input.resource,
    cost: {
      amount_minor: input.amountMinor,
      currency: "USD",
    },
    metadata: {
      purpose: "saas_license",
    },
    issued_at: new Date().toISOString(),
  }
}

/**
 * Client-side scrub before POST /v1/actions/record.
 * Server also drops details under audit_mode=minimal.
 */
export function buildRecordedDetails(raw: Record<string, unknown>): Record<string, unknown> | undefined {
  return redactDetails(raw)
}

/**
 * Projection safe to log locally after evaluate (mirrors server scrub).
 */
export function scrubIntentForLocalLog(intent: ActionIntent): ActionIntent {
  return redactActionIntent(intent)
}
