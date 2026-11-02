/**
 * In-process ActionPolicy / SpendingPolicy evaluation.
 */

import { randomUUID } from "node:crypto"

import type { ActionIntent, ActionPolicy, SpendingPolicy } from "@limetry/sdk"

import { matchesResourcePattern } from "./resource-match.js"

export type ActionDecision = "allow" | "deny" | "approval_required"

export type ActionEvaluationResult = {
  approved: boolean
  decision: ActionDecision
  reasons: string[]
  decision_id: string
}

function isActionPolicy(policy: ActionPolicy | SpendingPolicy): policy is ActionPolicy {
  return "allowed_action_types" in policy
}

function isPolicyActive(policy: ActionPolicy | SpendingPolicy): boolean {
  if (policy.status !== "active") {
    return false
  }
  if ("effective_window" in policy) {
    const now = Date.now()
    if (now < new Date(policy.effective_window.effective_from).getTime()) {
      return false
    }
    if (policy.effective_window.expires_at
      && now >= new Date(policy.effective_window.expires_at).getTime()) {
      return false
    }
    return true
  }
  if ("effective_from" in policy && policy.effective_from
    && Date.now() < new Date(policy.effective_from).getTime()) {
    return false
  }
  if ("expires_at" in policy && policy.expires_at
    && Date.now() >= new Date(policy.expires_at).getTime()) {
    return false
  }
  return true
}

function evaluateActionPolicy(
  intent: ActionIntent,
  policy: ActionPolicy,
  denyReasons: string[],
  approvalReasons: string[],
): void {
  if ((policy.denied_action_types ?? []).includes(intent.action_type)) {
    denyReasons.push(`action_type ${intent.action_type} is denied`)
  }
  if (policy.allowed_action_types.length > 0
    && !policy.allowed_action_types.includes(intent.action_type)) {
    denyReasons.push(`action_type ${intent.action_type} is not in allowed_action_types`)
  }
  if (policy.agent_id !== "*" && intent.agent_id !== policy.agent_id) {
    denyReasons.push(`agent_id ${intent.agent_id} does not match policy agent ${policy.agent_id}`)
  }
  for (const pattern of policy.blocked_resource_patterns ?? []) {
    if (matchesResourcePattern(intent.resource, pattern)) {
      denyReasons.push(`resource ${intent.resource} matches blocked pattern ${pattern}`)
    }
  }
  const allowedPatterns = policy.allowed_resource_patterns ?? []
  if (allowedPatterns.length > 0
    && !allowedPatterns.some((pattern) => matchesResourcePattern(intent.resource, pattern))) {
    denyReasons.push(`resource ${intent.resource} does not match any allowed_resource_patterns`)
  }
  if (intent.cost && policy.max_cost_minor !== undefined
    && intent.cost.amount_minor > policy.max_cost_minor) {
    denyReasons.push(`cost ${intent.cost.amount_minor} exceeds max_cost_minor ${policy.max_cost_minor}`)
  }
  if ((policy.require_approval_action_types ?? []).includes(intent.action_type)) {
    approvalReasons.push(`action_type ${intent.action_type} requires human approval`)
  }
  for (const pattern of policy.require_approval_resource_patterns ?? []) {
    if (matchesResourcePattern(intent.resource, pattern)) {
      approvalReasons.push(`resource ${intent.resource} matches approval pattern ${pattern}`)
    }
  }
  if (intent.cost && policy.approval_cost_minor !== undefined
    && intent.cost.amount_minor >= policy.approval_cost_minor) {
    approvalReasons.push(
      `cost ${intent.cost.amount_minor} meets approval_cost_minor ${policy.approval_cost_minor}`,
    )
  }
}

function evaluateSpendingPolicy(
  intent: ActionIntent,
  policy: SpendingPolicy,
  denyReasons: string[],
): void {
  if (policy.agent_id !== "*" && intent.agent_id !== policy.agent_id) {
    denyReasons.push(`agent_id ${intent.agent_id} does not match policy agent ${policy.agent_id}`)
  }
  if (intent.cost && intent.cost.amount_minor > policy.limits.max_single_transaction_minor) {
    denyReasons.push(
      `cost ${intent.cost.amount_minor} exceeds max_single_transaction_minor ${policy.limits.max_single_transaction_minor}`,
    )
  }
}

/**
 * Evaluates an intent against an action or spending policy.
 *
 * @param intent - Intent to evaluate.
 * @param policy - Policy document.
 * @returns Evaluation result with a fresh decision id.
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
    evaluateActionPolicy(intent, policy, denyReasons, approvalReasons)
  } else {
    evaluateSpendingPolicy(intent, policy, denyReasons)
  }
  if (denyReasons.length > 0) {
    return { approved: false, decision: "deny", reasons: denyReasons, decision_id }
  }
  if (approvalReasons.length > 0) {
    return { approved: false, decision: "approval_required", reasons: approvalReasons, decision_id }
  }
  return { approved: true, decision: "allow", reasons: [], decision_id }
}
