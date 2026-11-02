/**
 * Storage ports shared by servers embedding the evaluation kernel.
 */

import type { ActionIntent, ActionPolicy, SpendingPolicy } from "@limetry/sdk"

export type RegistryPolicy = ActionPolicy | SpendingPolicy

export type StoredPolicy = {
  tenantId: string
  policy: RegistryPolicy
  createdAt: Date
  updatedAt: Date
}

export type PolicyRegistry = {
  registerPolicy: (
    tenantId: string,
    policy: RegistryPolicy,
  ) => StoredPolicy | Promise<StoredPolicy>
  getPolicy: (
    tenantId: string,
    policyId: string,
  ) => StoredPolicy | null | Promise<StoredPolicy | null>
  listPolicies: (tenantId: string) => StoredPolicy[] | Promise<StoredPolicy[]>
}

export type ApprovalStatus = "pending" | "approved" | "denied" | "expired"

export type ApprovalRecord = {
  id: string
  tenant_id: string
  decision_id: string
  policy_id: string
  agent_id: string
  action_type: string
  resource: string
  payload_hash: string
  intent: ActionIntent
  reasons: string[]
  status: ApprovalStatus
  created_at: string
  expires_at: string
  reviewer?: string
  resolved_at?: string
}

export type AuditEvent = {
  id: string
  tenant_id: string
  event_type: string
  subject_id: string
  details: Record<string, unknown>
  created_at: string
}

export type AuditStore = {
  append: (input: {
    tenant_id: string
    event_type: string
    subject_id: string
    details: Record<string, unknown>
  }) => Promise<AuditEvent>
  list: (tenantId: string, query: Record<string, unknown>) => Promise<{
    events: AuditEvent[]
    next_cursor?: string
  }>
}
