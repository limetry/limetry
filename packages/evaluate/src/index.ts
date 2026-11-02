/**
 * Public entry point for the Limetry in-process evaluation kernel.
 */

export {
  type ActionDecision,
  type ActionEvaluationResult,
  evaluateActionIntent,
} from "./action-evaluator.js"
export {
  createDecisionReceipt,
  type DecisionReceipt,
  type DecisionReceiptInput,
  verifyDecisionReceipt,
} from "./decision-receipt.js"
export type {
  ApprovalRecord,
  ApprovalStatus,
  AuditEvent,
  AuditStore,
  PolicyRegistry,
  RegistryPolicy,
  StoredPolicy,
} from "./ports.js"
export { matchesResourcePattern } from "./resource-match.js"
export {
  actionIntentSchema,
  actionPolicySchema,
  evaluateActionBodySchema,
  isActionIntent,
  isActionPolicy,
  recordActionBodySchema,
  upsertActionPolicyBodySchema,
} from "./schemas.js"
