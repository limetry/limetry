/**
 * Action/spending policy registry port and in-memory implementation.
 */

import type { ActionPolicy, SpendingPolicy } from "@limetry/sdk"

/**
 * Policy document accepted by the registry.
 */
export type RegistryPolicy = ActionPolicy | SpendingPolicy

/**
 * Stored policy metadata wrapper.
 */
export type StoredPolicy = {
  /**
   * Tenant that owns the policy.
   */
  tenantId: string
  /**
   * Policy document.
   */
  policy: RegistryPolicy
  /**
   * First insert time.
   */
  createdAt: Date
  /**
   * Last upsert time.
   */
  updatedAt: Date
}

/**
 * Value or Promise wrapper used by sync/async store implementations.
 *
 * @typeParam T - Resolved value type.
 */
type MaybePromise<T> = T | Promise<T>

/**
 * Port for tenant-scoped policy registration and lookup.
 */
export type PolicyRegistry = {
  /**
   * Upserts a policy for a tenant.
   *
   * @param tenantId - Tenant scope.
   * @param policy - Policy document (policy_id is the key).
   * @returns Stored metadata wrapper.
   */
  registerPolicy(tenantId: string, policy: RegistryPolicy): MaybePromise<StoredPolicy>
  /**
   * Fetches a policy by id.
   *
   * @param tenantId - Tenant scope.
   * @param policyId - Policy id.
   * @returns Stored policy or `null`.
   */
  getPolicy(tenantId: string, policyId: string): MaybePromise<StoredPolicy | null>
  /**
   * Lists all policies for a tenant.
   *
   * @param tenantId - Tenant scope.
   * @returns Stored policies.
   */
  listPolicies(tenantId: string): MaybePromise<StoredPolicy[]>
}

/**
 * Process-local policy registry (not durable across restarts).
 */
export class InMemoryPolicyRegistry implements PolicyRegistry {
  private readonly policies = new Map<string, StoredPolicy>()

  /**
   * Builds the map key for a tenant/policy pair.
   *
   * @param tenantId - Tenant id.
   * @param policyId - Policy id.
   * @returns Composite key.
   */
  private key(tenantId: string, policyId: string): string {
    return `${tenantId}:${policyId}`
  }

  /**
   * Upserts a policy in memory.
   *
   * @param tenantId - Tenant scope.
   * @param policy - Policy document.
   * @returns Stored wrapper preserving original `createdAt` on update.
   */
  registerPolicy(tenantId: string, policy: RegistryPolicy): StoredPolicy {
    const now = new Date()
    const existing = this.policies.get(this.key(tenantId, policy.policy_id))
    const stored: StoredPolicy = {
      tenantId,
      policy,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    }
    this.policies.set(this.key(tenantId, policy.policy_id), stored)
    return stored
  }

  /**
   * Looks up a policy by id.
   *
   * @param tenantId - Tenant scope.
   * @param policyId - Policy id.
   * @returns Stored policy or `null`.
   */
  getPolicy(tenantId: string, policyId: string): StoredPolicy | null {
    return this.policies.get(this.key(tenantId, policyId)) ?? null
  }

  /**
   * Lists policies for a tenant.
   *
   * @param tenantId - Tenant scope.
   * @returns Matching stored policies.
   */
  listPolicies(tenantId: string): StoredPolicy[] {
    return Array.from(this.policies.values()).filter((entry) => entry.tenantId === tenantId)
  }
}
