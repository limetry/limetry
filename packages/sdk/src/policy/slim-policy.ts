/**
 * Helpers that expand a small set of limits into full Limetry policy documents.
 *
 * Prefer these builders for CLI/MCP first-run instead of hand-rolled JSON.
 */

import { randomUUID } from "node:crypto"

import type { ActionPolicy, SpendingPolicy } from "../types.js"

/**
 * Minimal input used by {@link createSlimPolicy} to build a {@link SpendingPolicy}.
 */
export type SlimPolicyInput = {
  /**
   * Agent identity the policy governs.
   */
  agentId: string
  /**
   * Owning organization id; defaults to `"default"`.
   */
  organizationId?: string
  /**
   * Maximum amount allowed for a single transaction (minor units).
   */
  maxSingleTransactionMinor: number
  /**
   * Maximum aggregate daily spend (minor units).
   */
  maxDailySpendMinor: number
  /**
   * Maximum aggregate monthly spend (minor units); defaults to `maxDailySpendMinor * 30`.
   */
  maxMonthlySpendMinor?: number
  /**
   * ISO 4217 currency code; defaults to `"USD"`.
   */
  currency?: string
  /**
   * Per-minute transaction cap; defaults to `10`. Hour/day caps are derived from this.
   */
  maxTransactionsPerMinute?: number
  /**
   * Optional merchant allowlist; when non-empty, allowlist enforcement is enabled.
   */
  allowedMerchantIds?: string[]
  /**
   * Optional stable policy id; a UUID is generated when omitted.
   */
  policyId?: string
}

/**
 * Minimal input used by {@link createSlimActionPolicy} to build an {@link ActionPolicy}.
 */
export type SlimActionPolicyInput = {
  /**
   * Agent identity the policy governs.
   */
  agentId: string
  /**
   * Owning organization id; defaults to `"default"`.
   */
  organizationId?: string
  /**
   * Action types that are permitted when other rules pass.
   */
  allowedActionTypes: string[]
  /**
   * Action types that are always denied.
   */
  deniedActionTypes?: string[]
  /**
   * Glob/pattern list of resources that are allowed.
   */
  allowedResourcePatterns?: string[]
  /**
   * Glob/pattern list of resources that are blocked.
   */
  blockedResourcePatterns?: string[]
  /**
   * Maximum allowed intent cost in minor units.
   */
  maxCostMinor?: number
  /**
   * Currency expected for cost checks when set.
   */
  currency?: string
  /**
   * Optional stable policy id; a UUID is generated when omitted.
   */
  policyId?: string
  /**
   * Audit retention mode; defaults to `"minimal"`.
   */
  auditMode?: "minimal" | "forensics"
  /**
   * Action types that still require human approval after allow rules pass.
   */
  requireApprovalActionTypes?: string[]
  /**
   * Resource patterns that force approval when matched.
   */
  requireApprovalResourcePatterns?: string[]
  /**
   * Inclusive cost threshold (minor units) that forces approval when cost is set.
   */
  approvalCostMinor?: number
}

/**
 * Builds a full {@link SpendingPolicy} from a small set of limits.
 *
 * Prefer this for CLI/MCP first-run instead of hand-rolled JSON. Sets version
 * `1`, status `"active"`, sensible replay/isolation defaults, and derives
 * velocity and monthly caps when those inputs are omitted.
 *
 * @param input - Slim spending limits and identity fields.
 * @returns Fully populated {@link SpendingPolicy} ready for persistence or evaluation.
 */
export function createSlimPolicy(input: SlimPolicyInput): SpendingPolicy {
  const currency = input.currency ?? "USD"
  const policyId = input.policyId ?? randomUUID()
  const now = new Date().toISOString()
  const allowed = input.allowedMerchantIds ?? []
  const maxSingle = input.maxSingleTransactionMinor
  const maxDaily = input.maxDailySpendMinor
  const maxMonthly = input.maxMonthlySpendMinor ?? maxDaily * 30

  return {
    policy_id: policyId,
    version: 1,
    organization_id: input.organizationId ?? "default",
    agent_id: input.agentId,
    limits: {
      max_single_transaction_minor: maxSingle,
      max_daily_spend_minor: maxDaily,
      max_monthly_spend_minor: maxMonthly,
      currency,
    },
    velocity: {
      max_transactions_per_minute: input.maxTransactionsPerMinute ?? 10,
      max_transactions_per_hour: (input.maxTransactionsPerMinute ?? 10) * 20,
      max_transactions_per_day: (input.maxTransactionsPerMinute ?? 10) * 100,
      max_aggregate_amount_per_hour_minor: Math.min(maxDaily, maxSingle * 20),
    },
    replay: {
      nonce_window_seconds: 300,
      max_clock_skew_seconds: 300,
      require_monotonic_nonce: true,
    },
    isolation: {
      max_concurrent_pending_intents: 5,
      max_pending_aggregate_minor: maxSingle * 5,
      intent_ttl_seconds: 300,
      enforce_unique_payee_per_intent_batch: true,
    },
    destination_rules: {
      allowed_merchant_ids: allowed,
      allowed_mcc_codes: [],
      blocked_merchant_ids: [],
      require_merchant_allowlist: allowed.length > 0,
    },
    effective_window: {
      effective_from: now,
      expires_at: null,
    },
    status: "active",
    updated_at: now,
  }
}

/**
 * Builds a generic {@link ActionPolicy} from a small set of action constraints.
 *
 * Sets version `1`, status `"active"`, `audit_mode` to the input or `"minimal"`,
 * and an open-ended effective window starting now.
 *
 * @param input - Slim action constraints and identity fields.
 * @returns Fully populated {@link ActionPolicy} ready for persistence or evaluation.
 */
export function createSlimActionPolicy(input: SlimActionPolicyInput): ActionPolicy {
  const policyId = input.policyId ?? randomUUID()
  const now = new Date().toISOString()

  return {
    policy_id: policyId,
    version: 1,
    organization_id: input.organizationId ?? "default",
    agent_id: input.agentId,
    allowed_action_types: input.allowedActionTypes,
    denied_action_types: input.deniedActionTypes,
    allowed_resource_patterns: input.allowedResourcePatterns,
    blocked_resource_patterns: input.blockedResourcePatterns,
    max_cost_minor: input.maxCostMinor,
    currency: input.currency,
    require_approval_action_types: input.requireApprovalActionTypes,
    require_approval_resource_patterns: input.requireApprovalResourcePatterns,
    approval_cost_minor: input.approvalCostMinor,
    audit_mode: input.auditMode ?? "minimal",
    status: "active",
    updated_at: now,
    effective_from: now,
    expires_at: null,
  }
}
