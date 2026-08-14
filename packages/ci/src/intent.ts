/**
 * ActionIntent builders for CI privilege and deploy gating.
 */

import { randomUUID } from "node:crypto"

import type { ActionIntent } from "@limetry/sdk"

/**
 * Inputs for {@link buildCiIntent}.
 */
export type BuildCiIntentInput = {
  /**
   * Registered ActionPolicy id.
   */
  policyId: string
  /**
   * Agent identity bound to the intent (for example `github_actions`).
   */
  agentId: string
  /**
   * CI action type to evaluate.
   */
  actionType: "ci_privilege" | "deploy"
  /**
   * Resource string, typically `repository@sha` from {@link buildRepoShaResource}.
   */
  resource: string
  /**
   * ISO-8601 issuance timestamp; defaults to now.
   */
  issuedAt?: string
  /**
   * String metadata attached to the intent (event name, trust, ref, etc.).
   */
  metadata?: Record<string, string>
}

/**
 * Build an ActionIntent for CI privilege or release/deploy gating.
 *
 * @param input - Policy, agent, action type, resource, and optional metadata.
 * @returns A new ActionIntent with a generated `intent_id`.
 */
export function buildCiIntent(input: BuildCiIntentInput): ActionIntent {
  return {
    intent_id: randomUUID(),
    policy_id: input.policyId,
    agent_id: input.agentId,
    action_type: input.actionType,
    resource: input.resource,
    metadata: input.metadata,
    issued_at: input.issuedAt ?? new Date().toISOString(),
  }
}

/**
 * Bind a repository and commit SHA into the ActionIntent resource field.
 *
 * @param repository - GitHub `owner/repo` string.
 * @param sha - Commit SHA being gated.
 * @returns Resource string in the form `repository@sha`.
 */
export function buildRepoShaResource(repository: string, sha: string): string {
  return `${repository}@${sha}`
}
