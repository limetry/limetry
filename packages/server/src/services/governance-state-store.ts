/**
 * Governance evaluation-state store for velocity/replay ledgers.
 */

import type { EvaluationState, PolicyEvaluationResponse } from "@limetry/sdk"

/**
 * Composite key for per-agent policy evaluation state.
 */
export type GovernanceStateKey = {
  /**
   * Tenant id.
   */
  tenantId: string
  /**
   * Agent id.
   */
  agentId: string
  /**
   * Policy id.
   */
  policyId: string
}

/**
 * Port for reading/writing evaluation state with optional atomic evaluate-and-save.
 */
export type GovernanceStateStore = {
  /**
   * Loads state for a key, or an empty ledger when missing.
   *
   * @param key - Composite state key.
   * @returns Evaluation state.
   */
  getState(key: GovernanceStateKey): Promise<EvaluationState>
  /**
   * Persists state for a key.
   *
   * @param key - Composite state key.
   * @param state - State to save.
   * @returns Nothing.
   */
  saveState(key: GovernanceStateKey, state: EvaluationState): Promise<void>
  /**
   * Runs an evaluator against current state and persists when the result is ok.
   *
   * @param key - Composite state key.
   * @param evaluator - Pure function of current state producing a response.
   * @returns Evaluation response (and may persist `result.state`).
   */
  evaluateAndSave(
    key: GovernanceStateKey,
    evaluator: (state: EvaluationState) => PolicyEvaluationResponse,
  ): Promise<PolicyEvaluationResponse>
}

/**
 * Returns an empty evaluation state ledger.
 *
 * @returns Empty velocity and replay stores.
 */
const emptyState = (): EvaluationState => ({
  velocity_ledger: {},
  replay_store: {},
})

/**
 * Process-local governance state store.
 */
export class InMemoryGovernanceStateStore implements GovernanceStateStore {
  private readonly states = new Map<string, EvaluationState>()

  /**
   * Serializes a composite key for the map.
   *
   * @param key - Governance state key.
   * @returns String map key.
   */
  private serializeKey(key: GovernanceStateKey): string {
    return `${key.tenantId}:${key.agentId}:${key.policyId}`
  }

  /**
   * @param key - Composite state key.
   * @returns Cloned empty state when missing.
   */
  async getState(key: GovernanceStateKey): Promise<EvaluationState> {
    return this.states.get(this.serializeKey(key)) ?? emptyState()
  }

  /**
   * @param key - Composite state key.
   * @param state - State to clone and store.
   * @returns Nothing.
   */
  async saveState(key: GovernanceStateKey, state: EvaluationState): Promise<void> {
    this.states.set(this.serializeKey(key), structuredClone(state))
  }

  /**
   * @param key - Composite state key.
   * @param evaluator - Evaluator over a cloned current state.
   * @returns Evaluation response; saves state when `ok` and `state` are set.
   */
  async evaluateAndSave(
    key: GovernanceStateKey,
    evaluator: (state: EvaluationState) => PolicyEvaluationResponse,
  ): Promise<PolicyEvaluationResponse> {
    const state = structuredClone(await this.getState(key))
    const result = evaluator(state)
    if (result.ok && result.state) {
      await this.saveState(key, result.state)
    }
    return result
  }
}
