/**
 * Shared {@link PolicyEngine} contract for action-intent evaluation.
 *
 * Adapters (`\@limetry/ci`, `\@limetry/sql`, `\@limetry/shopify`) call
 * `evaluateAction` and must not reimplement policy logic locally.
 */

/**
 * Shared interface implemented by {@link RemotePolicyEngine} (HTTP).
 *
 * Adapters call `evaluateAction` and must not reimplement policy logic.
 */
export type PolicyEngine = {
  /**
   * Evaluates an {@link ActionIntent} against the configured policy engine.
   *
   * @param intent - Action intent to evaluate.
   * @returns Promise resolving to an {@link ActionEvaluationResponse}.
   */
  evaluateAction: (
    intent: import("../types.js").ActionIntent,
  ) => Promise<import("../types.js").ActionEvaluationResponse>
}
