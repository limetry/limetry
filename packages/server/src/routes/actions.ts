/**
 * Governance HTTP routes: policy evaluate/record, audit, policies, approvals.
 *
 * Mounts under `/v1/*` with bearer auth and scope checks for `\@limetry/server`.
 */

import { createHash } from "node:crypto"

import {
  type ActionIntent,
  type ActionPolicy,
  buildEvaluatedAuditDetails,
  buildRecordedAuditDetails,
  resolveAuditMode,
} from "@limetry/sdk"
import type { Express, Request, Response } from "express"

import type { ServerEnv } from "../env.js"
import { decisionReceiptSecret } from "../env.js"
import {
  type BearerAuthRequest,
  createBearerAuthMiddleware,
  requireScopes,
} from "../middleware/bearer-auth.js"
import {
  evaluateActionBodySchema,
  isActionIntent,
  recordActionBodySchema,
  upsertActionPolicyBodySchema,
} from "../schemas/action.js"
import { evaluateActionIntent } from "../services/action-evaluator.js"
import type { ApprovalStore } from "../services/approval-store.js"
import type { AuditStore } from "../services/audit-store.js"
import { createDecisionReceipt } from "../services/decision-receipt.js"
import type { PolicyRegistry } from "../services/policy-registry.js"
import type { UserService } from "../services/user-service.js"

/**
 * SHA-256 hex digest of a canonical JSON intent (decision receipt binding).
 *
 * @param intent - Action intent or JSON-serializable record.
 * @returns Hex digest string.
 */
function intentDigest(intent: ActionIntent | Record<string, unknown>): string {
  return createHash("sha256").update(JSON.stringify(intent)).digest("hex")
}

/**
 * SHA-256 hex digest used as the approval payload hash.
 *
 * @param payload - Value to hash (typically the full intent).
 * @returns Hex digest string.
 */
function payloadHash(payload: unknown): string {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex")
}

/**
 * Narrows a stored policy JSON blob to an {@link ActionPolicy} when possible.
 *
 * @param policy - Stored policy document.
 * @returns ActionPolicy when `allowed_action_types` is present; otherwise `null`.
 */
function asActionPolicy(policy: ActionPolicy | Record<string, unknown>): ActionPolicy | null {
  if ("allowed_action_types" in policy) {
    return policy as ActionPolicy
  }
  return null
}

/**
 * Store and env dependencies for action/governance routes.
 */
export type ActionRouteDependencies = {
  /**
   * Validated server environment (audit defaults, receipt secret).
   */
  env: ServerEnv
  /**
   * Policy registry for evaluate/list/upsert.
   */
  policyRegistry: PolicyRegistry
  /**
   * Audit event append/list store.
   */
  auditStore: AuditStore
  /**
   * Pending human-approval store.
   */
  approvalStore: ApprovalStore
  /**
   * User service for bearer access-token auth.
   */
  userService: UserService
}

/**
 * Registers evaluate, record, audit, policy, and approval routes on `app`.
 *
 * Notable endpoints:
 * - `POST /v1/policy/evaluate` — evaluate intent, emit receipt, create approval when required
 * - `POST /v1/actions/record` — append `action.recorded` audit event
 * - `GET /v1/audit` — cursor-paginated audit tail
 * - `GET|PUT /v1/policies` — list / upsert ActionPolicy
 * - `GET /v1/approvals` and approve/deny — resolve pending approvals with optional payload re-bind
 *
 * @param app - Express application.
 * @param dependencies - Env and store implementations.
 * @returns Nothing.
 */
export function createActionRoutes(app: Express, dependencies: ActionRouteDependencies): void {
  const {
    env,
    policyRegistry,
    auditStore,
    approvalStore,
    userService,
  } = dependencies
  const bearerAuth = createBearerAuthMiddleware(env, userService)
  const receiptSecret = decisionReceiptSecret(env)

  app.post(
    "/v1/policy/evaluate",
    bearerAuth,
    requireScopes("policy:evaluate"),
    async (request: Request, response: Response) => {
      const body = request.body as Record<string, unknown>
      const tenantId =
        (request as BearerAuthRequest).bearerPrincipal?.tenantId ??
        (typeof body.tenant_id === "string" ? body.tenant_id : "default")

      if (!isActionIntent(body.intent)) {
        response.status(400).json({
          ok: false,
          code: "invalid_request",
          message: "Provide policy_id and an ActionIntent",
        })
        return
      }

      const parsed = evaluateActionBodySchema.safeParse(body)
      if (!parsed.success) {
        response.status(400).json({
          ok: false,
          code: "invalid_request",
          message: parsed.error.message,
        })
        return
      }

      const stored = await policyRegistry.getPolicy(tenantId, parsed.data.policy_id)
      if (!stored) {
        response.status(404).json({
          ok: false,
          code: "policy_not_found",
          error: "Policy not found",
        })
        return
      }

      const actionPolicy = asActionPolicy(stored.policy)
      if (!actionPolicy) {
        response.status(400).json({
          ok: false,
          code: "policy_not_action",
          error: "Policy is not an ActionPolicy",
        })
        return
      }

      const evaluation = evaluateActionIntent(parsed.data.intent, actionPolicy)
      const digest = intentDigest(parsed.data.intent)
      const receipt = createDecisionReceipt(receiptSecret, {
        decision: evaluation.decision,
        decisionId: evaluation.decision_id,
        digest,
        reasons: evaluation.reasons,
      })

      let approval_id: string | undefined
      if (evaluation.decision === "approval_required") {
        const pending = await approvalStore.create({
          tenant_id: tenantId,
          decision_id: evaluation.decision_id,
          policy_id: parsed.data.policy_id,
          agent_id: parsed.data.intent.agent_id,
          action_type: parsed.data.intent.action_type,
          resource: parsed.data.intent.resource,
          payload_hash: payloadHash(parsed.data.intent),
          intent: parsed.data.intent,
          reasons: evaluation.reasons,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        })
        approval_id = pending.id
      }

      const auditMode = resolveAuditMode(actionPolicy, env.LIMETRY_DEFAULT_AUDIT_MODE)

      await auditStore.append({
        tenant_id: tenantId,
        event_type: "policy.evaluated",
        subject_id: evaluation.decision_id,
        details: buildEvaluatedAuditDetails({
          approved: evaluation.approved,
          reasons: evaluation.reasons,
          policy_id: parsed.data.policy_id,
          intent: parsed.data.intent,
          mode: auditMode,
        }),
      })

      response.status(200).json({
        ok: true,
        approved: evaluation.approved,
        decision: evaluation.decision,
        reasons: evaluation.reasons,
        decision_id: evaluation.decision_id,
        approval_id,
        receipt,
      })
    },
  )

  app.post(
    "/v1/actions/record",
    bearerAuth,
    requireScopes("actions:record"),
    async (request: Request, response: Response) => {
      const parsed = recordActionBodySchema.safeParse(request.body)
      if (!parsed.success) {
        response.status(400).json({
          ok: false,
          code: "invalid_request",
          message: parsed.error.message,
        })
        return
      }

      const tenantId =
        (request as BearerAuthRequest).bearerPrincipal?.tenantId ??
        parsed.data.tenant_id ??
        "default"

      const stored = await policyRegistry.getPolicy(tenantId, parsed.data.intent.policy_id)
      const actionPolicy = stored ? asActionPolicy(stored.policy) : null
      const auditMode = resolveAuditMode(actionPolicy, env.LIMETRY_DEFAULT_AUDIT_MODE)

      const event = await auditStore.append({
        tenant_id: tenantId,
        event_type: "action.recorded",
        subject_id: parsed.data.decision_id ?? parsed.data.intent.intent_id,
        details: buildRecordedAuditDetails({
          outcome: parsed.data.outcome,
          decision_id: parsed.data.decision_id ?? null,
          intent: parsed.data.intent,
          details: parsed.data.details,
          mode: auditMode,
        }),
      })

      response.status(201).json({
        ok: true,
        event_id: event.id,
        recorded_at: event.created_at,
      })
    },
  )

  app.get(
    "/v1/audit",
    bearerAuth,
    requireScopes("audit:read"),
    async (request: Request, response: Response) => {
      const tenantId =
        (request as BearerAuthRequest).bearerPrincipal?.tenantId ?? "default"
      const limit = request.query.limit
        ? Number.parseInt(String(request.query.limit), 10)
        : undefined
      const cursor = typeof request.query.cursor === "string"
        ? request.query.cursor
        : undefined
      const event_type = typeof request.query.event_type === "string"
        ? request.query.event_type
        : undefined
      const agent_id = typeof request.query.agent_id === "string"
        ? request.query.agent_id
        : undefined

      const result = await auditStore.list(tenantId, {
        limit,
        cursor,
        event_type,
        agent_id,
      })

      response.status(200).json({
        ok: true,
        events: result.events,
        next_cursor: result.next_cursor,
      })
    },
  )

  app.get(
    "/v1/policies",
    bearerAuth,
    requireScopes("policies:read"),
    async (request: Request, response: Response) => {
      const tenantId =
        (request as BearerAuthRequest).bearerPrincipal?.tenantId ?? "default"
      const policies = await policyRegistry.listPolicies(tenantId)

      response.status(200).json({
        ok: true,
        policies: policies.map((entry) => ({
          policy_id: entry.policy.policy_id,
          agent_id: entry.policy.agent_id,
          version: entry.policy.version,
          status: entry.policy.status,
          updated_at: entry.updatedAt.toISOString(),
          policy: entry.policy,
        })),
      })
    },
  )

  app.put(
    "/v1/policies/:policyId",
    bearerAuth,
    requireScopes("policies:write"),
    async (request: Request, response: Response) => {
      const parsed = upsertActionPolicyBodySchema.safeParse({
        ...request.body as Record<string, unknown>,
        policy: {
          ...(request.body as { policy?: Record<string, unknown> }).policy,
          policy_id: request.params.policyId,
        },
      })

      if (!parsed.success) {
        response.status(400).json({
          ok: false,
          code: "invalid_request",
          message: parsed.error.message,
        })
        return
      }

      const tenantId =
        (request as BearerAuthRequest).bearerPrincipal?.tenantId ??
        parsed.data.tenant_id ??
        "default"

      const stored = await policyRegistry.registerPolicy(
        tenantId,
        parsed.data.policy as ActionPolicy,
      )

      response.status(200).json({
        ok: true,
        policy_id: stored.policy.policy_id,
        updated_at: stored.updatedAt.toISOString(),
      })
    },
  )

  app.get(
    "/v1/approvals",
    bearerAuth,
    requireScopes("approvals:read"),
    async (request: Request, response: Response) => {
      const tenantId =
        (request as BearerAuthRequest).bearerPrincipal?.tenantId ?? "default"
      const status = typeof request.query.status === "string"
        ? request.query.status
        : "pending"
      const approvals = await approvalStore.list(tenantId, { status })
      response.status(200).json({ ok: true, approvals })
    },
  )

  app.post(
    "/v1/approvals/:approvalId/approve",
    bearerAuth,
    requireScopes("approvals:write"),
    async (request: Request, response: Response) => {
      const tenantId =
        (request as BearerAuthRequest).bearerPrincipal?.tenantId ?? "default"
      const reviewer =
        typeof (request.body as { reviewer?: string }).reviewer === "string"
          ? (request.body as { reviewer: string }).reviewer
          : (request as BearerAuthRequest).bearerPrincipal?.userId ?? "operator"
      const intent = (request.body as { intent?: ActionIntent }).intent
      const approvalId = String(request.params.approvalId ?? "")
      const result = await approvalStore.resolve({
        tenantId,
        approvalId,
        decision: "approved",
        reviewer,
        intent,
      })
      if (!result.ok) {
        response.status(result.status).json({
          ok: false,
          code: result.code,
          error: result.error,
        })
        return
      }
      await auditStore.append({
        tenant_id: tenantId,
        event_type: "approval.resolved",
        subject_id: result.approval.id,
        details: {
          decision: "approved",
          reviewer,
          decision_id: result.approval.decision_id,
          payload_hash: result.approval.payload_hash,
        },
      })
      response.status(200).json({ ok: true, approval: result.approval })
    },
  )

  app.post(
    "/v1/approvals/:approvalId/deny",
    bearerAuth,
    requireScopes("approvals:write"),
    async (request: Request, response: Response) => {
      const tenantId =
        (request as BearerAuthRequest).bearerPrincipal?.tenantId ?? "default"
      const reviewer =
        typeof (request.body as { reviewer?: string }).reviewer === "string"
          ? (request.body as { reviewer: string }).reviewer
          : (request as BearerAuthRequest).bearerPrincipal?.userId ?? "operator"
      const approvalId = String(request.params.approvalId ?? "")
      const result = await approvalStore.resolve({
        tenantId,
        approvalId,
        decision: "denied",
        reviewer,
      })
      if (!result.ok) {
        response.status(result.status).json({
          ok: false,
          code: result.code,
          error: result.error,
        })
        return
      }
      await auditStore.append({
        tenant_id: tenantId,
        event_type: "approval.resolved",
        subject_id: result.approval.id,
        details: {
          decision: "denied",
          reviewer,
          decision_id: result.approval.decision_id,
          payload_hash: result.approval.payload_hash,
        },
      })
      response.status(200).json({ ok: true, approval: result.approval })
    },
  )
}
