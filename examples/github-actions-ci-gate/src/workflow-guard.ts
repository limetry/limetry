import {
  classifyEventTrust,
  evaluateCiPrivilege,
  type EvaluateCiPrivilegeResult,
} from "@limetry/ci"

import { ciCodingAgentPolicy } from "./policy.js"

export type GuardWorkflowInput = {
  eventName: string
  ref?: string
  repository: string
  sha: string
  apiKey: string
  baseUrl?: string
  fetch?: typeof globalThis.fetch
  actionType?: "ci_privilege" | "deploy"
}

export type GuardWorkflowResult = {
  allowed: boolean
  trust: string
  decision: string
  reasons: string[]
  approval_id?: string
  evaluationResult?: EvaluateCiPrivilegeResult
}

/**
 * Evaluates a GitHub Actions job before privileged work.
 * `ci_privilege` (tests/typecheck) is evaluated even on pull_request.
 * `deploy` fast-fails untrusted events, then evaluates trusted refs.
 */
export async function guardDeploymentWorkflow(
  input: GuardWorkflowInput,
): Promise<GuardWorkflowResult> {
  const actionType = input.actionType ?? "deploy"
  const trust = classifyEventTrust({
    eventName: input.eventName,
    ref: input.ref,
  })

  if (actionType === "deploy" && trust === "untrusted") {
    return {
      allowed: false,
      trust,
      decision: "deny",
      reasons: [
        `Refusing privileged deployment for untrusted event '${input.eventName}' on ref '${input.ref ?? "unknown"}'`,
      ],
    }
  }

  const result = await evaluateCiPrivilege({
    baseUrl: input.baseUrl,
    apiKey: input.apiKey,
    policyId: ciCodingAgentPolicy.policy_id,
    agentId: ciCodingAgentPolicy.agent_id,
    actionType,
    repository: input.repository,
    sha: input.sha,
    eventName: input.eventName,
    ref: input.ref,
    fetch: input.fetch,
  })

  const decision = result.evaluation.decision ?? (result.evaluation.approved ? "allow" : "deny")

  return {
    allowed: decision === "allow",
    trust: result.trust,
    decision,
    reasons: result.evaluation.reasons ?? [],
    approval_id: result.evaluation.approval_id,
    evaluationResult: result,
  }
}
