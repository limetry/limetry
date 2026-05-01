/**
 * Zod schemas and type guards for ActionIntent / ActionPolicy HTTP bodies.
 */

import type { ActionIntent, ActionPolicy } from "@limetry/sdk"
import { z } from "zod"

export type { ActionIntent, ActionPolicy }

/**
 * Zod schema for an `\@limetry/sdk` ActionIntent payload.
 */
export const actionIntentSchema = z.object({
  intent_id: z.string().uuid(),
  policy_id: z.string().uuid(),
  agent_id: z.string().min(1),
  action_type: z.string().min(1),
  resource: z.string().min(1),
  cost: z.object({
    amount_minor: z.number().int().nonnegative(),
    currency: z.string().min(3),
  }).optional(),
  metadata: z.record(z.string(), z.string()).optional(),
  issued_at: z.string().datetime(),
  nonce: z.union([z.string().min(1), z.number()]).optional(),
})

/**
 * Zod schema for an `\@limetry/sdk` ActionPolicy document.
 */
export const actionPolicySchema = z.object({
  policy_id: z.string().uuid(),
  version: z.number().int().positive(),
  organization_id: z.string().min(1),
  agent_id: z.string().min(1),
  allowed_action_types: z.array(z.string()),
  denied_action_types: z.array(z.string()).optional(),
  allowed_resource_patterns: z.array(z.string()).optional(),
  blocked_resource_patterns: z.array(z.string()).optional(),
  max_cost_minor: z.number().int().positive().optional(),
  currency: z.string().min(3).optional(),
  require_approval_action_types: z.array(z.string()).optional(),
  require_approval_resource_patterns: z.array(z.string()).optional(),
  approval_cost_minor: z.number().int().nonnegative().optional(),
  audit_mode: z.enum(["minimal", "forensics"]).optional(),
  status: z.enum(["active", "suspended", "revoked"]).default("active"),
  updated_at: z.string().datetime(),
  effective_from: z.string().datetime().optional(),
  expires_at: z.string().datetime().nullable().optional(),
})

/**
 * Request body for `POST /v1/policy/evaluate`.
 */
export const evaluateActionBodySchema = z.object({
  tenant_id: z.string().min(1).optional(),
  policy_id: z.string().uuid(),
  intent: actionIntentSchema,
})

/**
 * Request body for `POST /v1/actions/record`.
 */
export const recordActionBodySchema = z.object({
  tenant_id: z.string().min(1).optional(),
  intent: actionIntentSchema,
  decision_id: z.string().uuid().optional(),
  outcome: z.enum(["executed", "skipped", "blocked"]),
  details: z.record(z.string(), z.unknown()).optional(),
})

/**
 * Request body for `PUT /v1/policies/:policyId`.
 */
export const upsertActionPolicyBodySchema = z.object({
  tenant_id: z.string().min(1).optional(),
  policy: actionPolicySchema,
})

/**
 * Lightweight structural guard used before full Zod parse on evaluate.
 *
 * @param value - Unknown request body `intent` field.
 * @returns Whether the value looks like an ActionIntent.
 */
export function isActionIntent(value: unknown): value is ActionIntent {
  if (typeof value !== "object" || value === null) {
    return false
  }
  const candidate = value as Record<string, unknown>
  return typeof candidate.action_type === "string" && typeof candidate.resource === "string"
}

/**
 * Type guard distinguishing ActionPolicy from SpendingPolicy-shaped documents.
 *
 * @param policy - Policy JSON from the registry.
 * @returns `true` when `allowed_action_types` is present.
 */
export function isActionPolicy(policy: ActionPolicy | Record<string, unknown>): policy is ActionPolicy {
  return "allowed_action_types" in policy
}
