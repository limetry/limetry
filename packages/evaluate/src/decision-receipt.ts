/**
 * HMAC-SHA256 decision receipts for evaluate responses.
 */

import { createHmac, randomUUID } from "node:crypto"

export type DecisionReceiptInput = {
  decision: "allow" | "deny" | "approval_required"
  decisionId?: string
  digest: string
  expSeconds?: number
  reasons?: string[]
}

export type DecisionReceipt = {
  decision: "allow" | "deny" | "approval_required"
  decision_id: string
  digest: string
  exp: number
  reasons: string[]
  sig: string
}

function receiptPayload(receipt: Omit<DecisionReceipt, "sig">): string {
  return [
    receipt.decision_id,
    receipt.decision,
    receipt.digest,
    String(receipt.exp),
    receipt.reasons.join("|"),
  ].join(".")
}

/**
 * Creates a signed decision receipt.
 *
 * @param secret - HMAC key.
 * @param input - Decision fields to sign.
 * @returns Signed receipt.
 */
export function createDecisionReceipt(
  secret: string,
  input: DecisionReceiptInput,
): DecisionReceipt {
  const receipt: Omit<DecisionReceipt, "sig"> = {
    decision_id: input.decisionId ?? randomUUID(),
    decision: input.decision,
    digest: input.digest,
    exp: Math.floor(Date.now() / 1000) + (input.expSeconds ?? 300),
    reasons: input.reasons ?? [],
  }
  return {
    ...receipt,
    sig: createHmac("sha256", secret).update(receiptPayload(receipt)).digest("hex"),
  }
}

/**
 * Verifies a receipt signature and expiry.
 *
 * @param secret - HMAC key.
 * @param receipt - Receipt to verify.
 * @returns Whether the receipt is valid.
 */
export function verifyDecisionReceipt(secret: string, receipt: DecisionReceipt): boolean {
  const expected = createHmac("sha256", secret)
    .update(receiptPayload(receipt))
    .digest("hex")
  if (expected.length !== receipt.sig.length) {
    return false
  }
  let mismatch = 0
  for (let index = 0; index < expected.length; index += 1) {
    mismatch |= expected.charCodeAt(index) ^ receipt.sig.charCodeAt(index)
  }
  return mismatch === 0 && receipt.exp >= Math.floor(Date.now() / 1000)
}
