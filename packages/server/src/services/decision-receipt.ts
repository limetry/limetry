/**
 * HMAC-SHA256 decision receipts for `\@limetry/server` evaluate responses.
 */

import { createHmac, randomUUID } from "node:crypto"

/**
 * Inputs for {@link createDecisionReceipt}.
 */
export type DecisionReceiptInput = {
  /**
   * Evaluation decision to bind.
   */
  decision: "allow" | "deny" | "approval_required"
  /**
   * Optional decision id; a UUID is minted when omitted.
   */
  decisionId?: string
  /**
   * SHA-256 hex digest of the evaluated intent JSON.
   */
  digest: string
  /**
   * Receipt TTL in seconds from now; defaults to 300.
   */
  expSeconds?: number
  /**
   * Evaluation reasons included in the signed payload.
   */
  reasons?: string[]
}

/**
 * Signed decision receipt returned to clients.
 */
export type DecisionReceipt = {
  /**
   * Bound decision.
   */
  decision: "allow" | "deny" | "approval_required"
  /**
   * Decision id.
   */
  decision_id: string
  /**
   * Intent digest.
   */
  digest: string
  /**
   * Unix expiry (seconds).
   */
  exp: number
  /**
   * Bound reasons.
   */
  reasons: string[]
  /**
   * Hex HMAC-SHA256 signature over the payload fields.
   */
  sig: string
}

/**
 * Builds an HMAC-SHA256 decision receipt so clients can detect tampering of
 * allow/deny/approval_required outcomes.
 *
 * @param secret - HMAC key (`DECISION_HMAC_SECRET` or `JWT_SECRET`).
 * @param input - Decision fields to sign.
 * @returns Signed {@link DecisionReceipt}.
 */
export function createDecisionReceipt(
  secret: string,
  input: DecisionReceiptInput,
): DecisionReceipt {
  const decisionId = input.decisionId ?? randomUUID()
  const exp = Math.floor(Date.now() / 1000) + (input.expSeconds ?? 300)
  const reasons = input.reasons ?? []
  const payload = [
    decisionId,
    input.decision,
    input.digest,
    String(exp),
    reasons.join("|"),
  ].join(".")
  const sig = createHmac("sha256", secret).update(payload).digest("hex")

  return {
    decision_id: decisionId,
    decision: input.decision,
    digest: input.digest,
    exp,
    reasons,
    sig,
  }
}

/**
 * Verifies a receipt signature and expiry with constant-time compare.
 *
 * @param secret - HMAC key used at creation time.
 * @param receipt - Receipt to verify.
 * @returns `true` when signature matches and `exp` is still in the future.
 */
export function verifyDecisionReceipt(
  secret: string,
  receipt: DecisionReceipt,
): boolean {
  const payload = [
    receipt.decision_id,
    receipt.decision,
    receipt.digest,
    String(receipt.exp),
    receipt.reasons.join("|"),
  ].join(".")
  const expected = createHmac("sha256", secret).update(payload).digest("hex")
  if (expected.length !== receipt.sig.length) {
    return false
  }
  let mismatch = 0
  for (let index = 0; index < expected.length; index += 1) {
    mismatch |= expected.charCodeAt(index) ^ receipt.sig.charCodeAt(index)
  }
  if (mismatch !== 0) {
    return false
  }
  return receipt.exp >= Math.floor(Date.now() / 1000)
}
