import { describe, expect, it } from "vitest"

import {
  createDecisionReceipt,
  verifyDecisionReceipt,
} from "../services/decision-receipt.js"

const secret = "test-decision-hmac-secret-at-least-32-chars"

describe("decision-receipt", () => {
  it("creates and verifies an HMAC decision receipt", () => {
    const receipt = createDecisionReceipt(secret, {
      decision: "allow",
      digest: "a".repeat(64),
      reasons: ["within limits"],
      decisionId: "33333333-3333-4333-8333-333333333333",
    })

    expect(receipt.decision).toBe("allow")
    expect(receipt.decision_id).toBe("33333333-3333-4333-8333-333333333333")
    expect(receipt.sig).toHaveLength(64)
    expect(verifyDecisionReceipt(secret, receipt)).toBe(true)
  })

  it("rejects receipts signed with a different secret", () => {
    const receipt = createDecisionReceipt(secret, {
      decision: "deny",
      digest: "b".repeat(64),
      reasons: ["blocked"],
    })

    expect(verifyDecisionReceipt("another-secret-at-least-32-characters-long", receipt)).toBe(false)
  })
})
