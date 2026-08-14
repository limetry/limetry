/**
 * Remote CI privilege / deploy evaluation against a Limetry ActionPolicy.
 */

import {
  type ActionEvaluationResponse,
  type ActionIntent,
  RemotePolicyEngine,
} from "@limetry/sdk"

import { classifyEventTrust, type EventTrust } from "./classify.js"
import { buildCiIntent, buildRepoShaResource } from "./intent.js"

/**
 * Successful ActionEvaluationResponse (`ok: true`) from `\@limetry/sdk`.
 */
export type OkActionEvaluation = Extract<ActionEvaluationResponse, { ok: true }>

/**
 * Inputs for {@link evaluateCiPrivilege}.
 */
export type EvaluateCiPrivilegeInput = {
  /**
   * Limetry API base URL; passed through to {@link RemotePolicyEngine}.
   */
  baseUrl?: string
  /**
   * Limetry API key / bearer token.
   */
  apiKey: string
  /**
   * Tenant id for multi-tenant evaluation.
   */
  tenantId?: string
  /**
   * ActionPolicy id to evaluate against.
   */
  policyId: string
  /**
   * Agent id recorded on the ActionIntent.
   */
  agentId: string
  /**
   * Whether this is a CI privilege check or a deploy gate.
   */
  actionType: "ci_privilege" | "deploy"
  /**
   * GitHub repository (`owner/repo`).
   */
  repository: string
  /**
   * Commit SHA being gated.
   */
  sha: string
  /**
   * GitHub Actions event name used for trust classification.
   */
  eventName: string
  /**
   * Optional git ref; pull refs force untrusted classification.
   */
  ref?: string
  /**
   * Optional fetch implementation for tests.
   */
  fetch?: typeof globalThis.fetch
}

/**
 * Combined trust classification, built intent, and successful evaluation result.
 */
export type EvaluateCiPrivilegeResult = {
  /**
   * Local trust classification for the GitHub event.
   */
  trust: EventTrust
  /**
   * ActionIntent submitted to Limetry.
   */
  intent: ActionIntent
  /**
   * Successful remote evaluation response.
   */
  evaluation: OkActionEvaluation
}

/**
 * Classify event trust and evaluate a CI privilege or deploy ActionIntent.
 *
 * Builds a `repository@sha` resource, attaches `event_name` / `trust` / optional
 * `ref` metadata, then calls {@link RemotePolicyEngine.evaluateAction}.
 *
 * @param input - API credentials, policy, repo context, and action type.
 * @returns Trust label, intent, and successful evaluation.
 * @throws Error When the remote evaluation returns `ok: false`.
 */
export async function evaluateCiPrivilege(
  input: EvaluateCiPrivilegeInput,
): Promise<EvaluateCiPrivilegeResult> {
  const trust = classifyEventTrust({
    eventName: input.eventName,
    ref: input.ref,
  })
  const intent = buildCiIntent({
    policyId: input.policyId,
    agentId: input.agentId,
    actionType: input.actionType,
    resource: buildRepoShaResource(input.repository, input.sha),
    metadata: {
      event_name: input.eventName,
      trust,
      ...(input.ref ? { ref: input.ref } : {}),
    },
  })
  const engine = new RemotePolicyEngine({
    baseUrl: input.baseUrl,
    apiKey: input.apiKey,
    tenantId: input.tenantId,
    fetch: input.fetch,
  })
  const evaluation = await engine.evaluateAction(intent)
  if (!evaluation.ok) {
    throw new Error(evaluation.error ?? "Limetry evaluate failed")
  }
  return { trust, intent, evaluation }
}
