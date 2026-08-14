/**
 * CI privilege and deploy gating helpers for GitHub Actions (`\@limetry/ci`).
 *
 * Classifies event trust, builds ActionIntents, evaluates against a remote
 * Limetry policy, verifies release receipts, and exposes the Action entrypoint.
 *
 * @packageDocumentation
 */

export { classifyEventTrust, type EventTrust } from "./classify.js"
export { evaluateCiPrivilege, type EvaluateCiPrivilegeInput, type EvaluateCiPrivilegeResult } from "./evaluate.js"
export { buildCiIntent, type BuildCiIntentInput,buildRepoShaResource } from "./intent.js"
export { type ReleaseReceiptFields,verifyReleaseReceipt } from "./receipt.js"
export { runAction } from "./run-action.js"
