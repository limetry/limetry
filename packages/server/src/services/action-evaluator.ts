/**
 * In-process ActionPolicy / SpendingPolicy evaluation for `\@limetry/server`.
 *
 * Produces `allow`, `deny`, or `approval_required` with a fresh `decision_id`.
 */

import { randomUUID } from "node:crypto"

import type { ActionIntent, ActionPolicy, SpendingPolicy } from "@limetry/sdk"

import { isActionPolicy } from "../schemas/action.js"
import { matchesResourcePattern } from "./resource-match.js"

/**
 * Discrete outcome of {@link evaluateActionIntent}.
 */
export type ActionDecision = "allow" | "deny" | "approval_required"

/**
 * Evaluation result returned to `/v1/policy/evaluate` handlers.
 */
export type ActionEvaluationResult = {
  /**
   * `true` only when decision is `allow`.
   */
  approved: boolean
  /**
   * Allow / deny / approval_required.
   */
  decision: ActionDecision
  /**
   * Human-readable deny or approval reasons (empty on allow).
   */
  reasons: string[]
  /**
   * Newly minted decision id for receipts and audit linkage.
   */
  decision_id: string
}

/**
 * Returns whether a policy is currently active given status and time windows.
 *
 * @param policy - Action or spending policy document.
 * @returns `false` when suspended/revoked or outside effective/expiry windows.
 */
function isPolicyActive(policy: ActionPolicy | SpendingPolicy): boolean {
  if (policy.status !== "active") {
    return false
  }
  if ("effective_window" in policy) {
    const now = Date.now()
    const effectiveFrom = new Date(policy.effective_window.effective_from).getTime()
    if (now < effectiveFrom) {
      return false
    }
    if (policy.effective_window.expires_at) {
      const expiresAt = new Date(policy.effective_window.expires_at).getTime()
      if (now >= expiresAt) {
        return false
      }
    }
    return true
  }
  if ("effective_from" in policy && policy.effective_from) {
    if (Date.now() < new Date(policy.effective_from).getTime()) {
      return false
    }
  }
  if ("expires_at" in policy && policy.expires_at) {
    if (Date.now() >= new Date(policy.expires_at).getTime()) {
      return false
    }
  }
  return true
}

/**
 * Applies ActionPolicy allow/deny/approval rules into reason buckets.
 *
 * @param intent - Intent under evaluation.
 * @param policy - Action policy.
 * @param denyReasons - Mutable deny reason list.
 * @param approvalReasons - Mutable approval reason list.
 * @returns Nothing.
 */
function evaluateAgainstActionPolicy(
  intent: ActionIntent,
  policy: ActionPolicy,
  denyReasons: string[],
  approvalReasons: string[],
): void {
  const deniedTypes = policy.denied_action_types ?? []
  if (deniedTypes.includes(intent.action_type)) {
    denyReasons.push(`action_type ${intent.action_type} is denied`)
  }

  if (
    policy.allowed_action_types.length > 0
    && !policy.allowed_action_types.includes(intent.action_type)
  ) {
    denyReasons.push(`action_type ${intent.action_type} is not in allowed_action_types`)
  }

  if (policy.agent_id !== "*" && intent.agent_id !== policy.agent_id) {
    denyReasons.push(`agent_id ${intent.agent_id} does not match policy agent ${policy.agent_id}`)
  }

  const blockedPatterns = policy.blocked_resource_patterns ?? []
  for (const pattern of blockedPatterns) {
    if (matchesResourcePattern(intent.resource, pattern)) {
      denyReasons.push(`resource ${intent.resource} matches blocked pattern ${pattern}`)
    }
  }

  const allowedPatterns = policy.allowed_resource_patterns ?? []
  if (
    allowedPatterns.length > 0
    && !allowedPatterns.some((pattern) => matchesResourcePattern(intent.resource, pattern))
  ) {
    denyReasons.push(`resource ${intent.resource} does not match any allowed_resource_patterns`)
  }

  if (
    intent.cost
    && policy.max_cost_minor !== undefined
    && intent.cost.amount_minor > policy.max_cost_minor
  ) {
    denyReasons.push(
      `cost ${intent.cost.amount_minor} exceeds max_cost_minor ${policy.max_cost_minor}`,
    )
  }

  const requireApprovalTypes = policy.require_approval_action_types ?? []
  if (requireApprovalTypes.includes(intent.action_type)) {
    approvalReasons.push(`action_type ${intent.action_type} requires human approval`)
  }

  const approvalPatterns = policy.require_approval_resource_patterns ?? []
  for (const pattern of approvalPatterns) {
    if (matchesResourcePattern(intent.resource, pattern)) {
      approvalReasons.push(`resource ${intent.resource} matches approval pattern ${pattern}`)
    }
  }

  if (
    intent.cost
    && policy.approval_cost_minor !== undefined
    && intent.cost.amount_minor >= policy.approval_cost_minor
  ) {
    approvalReasons.push(
      `cost ${intent.cost.amount_minor} meets approval_cost_minor ${policy.approval_cost_minor}`,
    )
  }
}

/**
 * Applies SpendingPolicy agent and single-transaction limits into deny reasons.
 *
 * @param intent - Intent under evaluation.
 * @param policy - Spending policy.
 * @param denyReasons - Mutable deny reason list.
 * @returns Nothing.
 */
function evaluateAgainstSpendingPolicy(
  intent: ActionIntent,
  policy: SpendingPolicy,
  denyReasons: string[],
): void {
  if (policy.agent_id !== "*" && intent.agent_id !== policy.agent_id) {
    denyReasons.push(`agent_id ${intent.agent_id} does not match policy agent ${policy.agent_id}`)
  }

  if (
    intent.cost
    && intent.cost.amount_minor > policy.limits.max_single_transaction_minor
  ) {
    denyReasons.push(
      `cost ${intent.cost.amount_minor} exceeds max_single_transaction_minor ${policy.limits.max_single_transaction_minor}`,
    )
  }
}

/**
 * Evaluates an ActionIntent against an ActionPolicy or SpendingPolicy.
 *
 * Deny reasons take precedence over approval reasons. Inactive policies always deny.
 *
 * @param intent - Intent to evaluate.
 * @param policy - Policy document from the registry.
 * @returns Evaluation result with a new `decision_id`.
 */
export function evaluateActionIntent(
  intent: ActionIntent,
  policy: ActionPolicy | SpendingPolicy,
): ActionEvaluationResult {
  const denyReasons: string[] = []
  const approvalReasons: string[] = []
  const decision_id = randomUUID()

  if (!isPolicyActive(policy)) {
    denyReasons.push("policy is not active")
  }

  if (isActionPolicy(policy)) {
    evaluateAgainstActionPolicy(intent, policy, denyReasons, approvalReasons)
  } else {
    evaluateAgainstSpendingPolicy(intent, policy, denyReasons)
  }

  if (denyReasons.length > 0) {
    return {
      approved: false,
      decision: "deny",
      reasons: denyReasons,
      decision_id,
    }
  }

  if (approvalReasons.length > 0) {
    return {
      approved: false,
      decision: "approval_required",
      reasons: approvalReasons,
      decision_id,
    }
  }

  return {
    approved: true,
    decision: "allow",
    reasons: [],
    decision_id,
  }
}
