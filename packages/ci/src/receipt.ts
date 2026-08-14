/**
 * HMAC decision receipt verification for release/deploy gating.
 */

import { createHmac, timingSafeEqual } from "node:crypto"

/**
 * Fields of a Limetry decision receipt used for release verification.
 */
export type ReleaseReceiptFields = {
  /**
   * Decision value (for example `allow` or `deny`).
   */
  decision: string
  /**
   * Unique decision identifier.
   */
  decision_id: string
  /**
   * Digest the receipt is bound to (typically a hash of the intent JSON).
   */
  digest: string
  /**
   * Unix expiry timestamp in seconds.
   */
  exp: number
  /**
   * Human-readable decision reasons.
   */
  reasons: string[]
  /**
   * Hex-encoded HMAC-SHA256 signature over the receipt payload.
   */
  sig: string
}

/**
 * Verify an HMAC decision receipt is bound to the expected digest (typically intent JSON hash).
 * Matches server `createDecisionReceipt` payload formatting.
 *
 * Checks digest equality, expiry, then timing-safe HMAC comparison of:
 * `decision_id.decision.digest.exp.reasonsJoinedByPipe`.
 *
 * @param input - Receipt fields, expected digest, and HMAC secret.
 * @returns `true` when the receipt is unexpired, digest-matched, and signature-valid.
 */
export function verifyReleaseReceipt(input: {
  receipt: ReleaseReceiptFields
  expectedDigest: string
  secret: string
}): boolean {
  if (input.receipt.digest !== input.expectedDigest) {
    return false
  }
  if (input.receipt.exp < Math.floor(Date.now() / 1000)) {
    return false
  }
  const payload = [
    input.receipt.decision_id,
    input.receipt.decision,
    input.receipt.digest,
    String(input.receipt.exp),
    input.receipt.reasons.join("|"),
  ].join(".")
  const expected = createHmac("sha256", input.secret).update(payload).digest("hex")
  const left = Buffer.from(expected, "utf8")
  const right = Buffer.from(input.receipt.sig, "utf8")
  if (left.length !== right.length) {
    return false
  }
  return timingSafeEqual(left, right)
}
