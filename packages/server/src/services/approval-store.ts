/**
 * Pending human-approval store for `approval_required` evaluate outcomes.
 */

import { createHash, randomUUID } from "node:crypto"

import type { ActionIntent } from "@limetry/sdk"

/**
 * Lifecycle status of an approval record.
 */
export type ApprovalStatus = "pending" | "approved" | "denied" | "expired"

/**
 * Persisted approval row created when evaluation requires a human.
 */
export type ApprovalRecord = {
  /**
   * Approval id.
   */
  id: string
  /**
   * Tenant scope.
   */
  tenant_id: string
  /**
   * Linked evaluate `decision_id`.
   */
  decision_id: string
  /**
   * Policy that produced the decision.
   */
  policy_id: string
  /**
   * Agent id from the intent.
   */
  agent_id: string
  /**
   * Action type from the intent.
   */
  action_type: string
  /**
   * Resource from the intent.
   */
  resource: string
  /**
   * SHA-256 of the original intent JSON for re-bind checks.
   */
  payload_hash: string
  /**
   * Original intent snapshot.
   */
  intent: ActionIntent
  /**
   * Approval reasons from evaluation.
   */
  reasons: string[]
  /**
   * Current status.
   */
  status: ApprovalStatus
  /**
   * Reviewer identity when resolved.
   */
  reviewer?: string
  /**
   * ISO creation time.
   */
  created_at: string
  /**
   * ISO expiry time.
   */
  expires_at: string
  /**
   * ISO resolution time when approved/denied.
   */
  resolved_at?: string
}

/**
 * Input for creating a pending approval.
 */
export type CreateApprovalInput = {
  /**
   * Tenant id.
   */
  tenant_id: string
  /**
   * Decision id from evaluate.
   */
  decision_id: string
  /**
   * Policy id.
   */
  policy_id: string
  /**
   * Agent id.
   */
  agent_id: string
  /**
   * Action type.
   */
  action_type: string
  /**
   * Resource.
   */
  resource: string
  /**
   * Intent payload hash.
   */
  payload_hash: string
  /**
   * Intent snapshot.
   */
  intent: ActionIntent
  /**
   * Reasons requiring approval.
   */
  reasons: string[]
  /**
   * ISO expiry.
   */
  expires_at: string
}

/**
 * Input for approving or denying a pending approval.
 */
export type ResolveApprovalInput = {
  /**
   * Tenant id.
   */
  tenantId: string
  /**
   * Approval id.
   */
  approvalId: string
  /**
   * Resolution decision.
   */
  decision: "approved" | "denied"
  /**
   * Reviewer identity string.
   */
  reviewer: string
  /**
   * Optional intent re-bind for approve (must match `payload_hash`).
   */
  intent?: ActionIntent
}

/**
 * Result of {@link ApprovalStore.resolve}.
 */
export type ResolveApprovalResult =
  | { ok: true; approval: ApprovalRecord }
  | { ok: false; status: number; code: string; error: string }

/**
 * Port for pending approval persistence.
 */
export type ApprovalStore = {
  /**
   * Creates a pending approval record.
   *
   * @param input - Approval fields.
   * @returns Created record.
   */
  create: (input: CreateApprovalInput) => Promise<ApprovalRecord>
  /**
   * Lists approvals for a tenant, optionally filtered by status (`pending` default, `all` for unfiltered).
   *
   * @param tenantId - Tenant scope.
   * @param options - Optional status filter.
   * @returns Matching approvals.
   */
  list: (tenantId: string, options?: { status?: string }) => Promise<ApprovalRecord[]>
  /**
   * Resolves a pending approval; validates expiry and optional payload re-bind.
   *
   * @param input - Resolution parameters.
   * @returns Success with record, or structured error with HTTP status/code.
   */
  resolve: (input: ResolveApprovalInput) => Promise<ResolveApprovalResult>
}

/**
 * SHA-256 hex digest of intent JSON for payload re-bind.
 *
 * @param intent - Intent to hash.
 * @returns Hex digest.
 */
function hashIntent(intent: ActionIntent): string {
  return createHash("sha256").update(JSON.stringify(intent)).digest("hex")
}

/**
 * Process-local approval store (not durable across restarts).
 */
export class InMemoryApprovalStore implements ApprovalStore {
  private readonly approvals = new Map<string, ApprovalRecord>()

  /**
   * Creates and stores a pending approval.
   *
   * @param input - Approval fields.
   * @returns Created record.
   */
  async create(input: CreateApprovalInput): Promise<ApprovalRecord> {
    const record: ApprovalRecord = {
      id: randomUUID(),
      tenant_id: input.tenant_id,
      decision_id: input.decision_id,
      policy_id: input.policy_id,
      agent_id: input.agent_id,
      action_type: input.action_type,
      resource: input.resource,
      payload_hash: input.payload_hash,
      intent: input.intent,
      reasons: input.reasons,
      status: "pending",
      created_at: new Date().toISOString(),
      expires_at: input.expires_at,
    }
    this.approvals.set(`${input.tenant_id}:${record.id}`, record)
    return record
  }

  /**
   * Lists approvals for a tenant.
   *
   * @param tenantId - Tenant scope.
   * @param options - Status filter (`pending` default).
   * @returns Matching records.
   */
  async list(tenantId: string, options?: { status?: string }): Promise<ApprovalRecord[]> {
    const status = options?.status ?? "pending"
    return [...this.approvals.values()].filter((row) => {
      if (row.tenant_id !== tenantId) {
        return false
      }
      if (status === "all") {
        return true
      }
      return row.status === status
    })
  }

  /**
   * Approves or denies a pending approval.
   *
   * @param input - Resolution parameters.
   * @returns Updated approval or error (`approval_not_found`, `approval_not_pending`,
   *   `approval_expired`, `payload_mismatch`).
   */
  async resolve(input: ResolveApprovalInput): Promise<ResolveApprovalResult> {
    const key = `${input.tenantId}:${input.approvalId}`
    const existing = this.approvals.get(key)
    if (!existing) {
      return {
        ok: false,
        status: 404,
        code: "approval_not_found",
        error: "Approval not found",
      }
    }
    if (existing.status !== "pending") {
      return {
        ok: false,
        status: 409,
        code: "approval_not_pending",
        error: `Approval is already ${existing.status}`,
      }
    }
    if (Date.parse(existing.expires_at) <= Date.now()) {
      existing.status = "expired"
      return {
        ok: false,
        status: 410,
        code: "approval_expired",
        error: "Approval has expired",
      }
    }
    if (input.decision === "approved" && input.intent) {
      const digest = hashIntent(input.intent)
      if (digest !== existing.payload_hash) {
        return {
          ok: false,
          status: 409,
          code: "payload_mismatch",
          error: "Intent payload hash does not match the pending approval",
        }
      }
    }

    existing.status = input.decision
    existing.reviewer = input.reviewer
    existing.resolved_at = new Date().toISOString()
    return { ok: true, approval: existing }
  }
}
