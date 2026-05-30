import { describe, expect, it } from "vitest"

import {
  buildProcurementActionPolicy,
  buildPurchaseIntent,
  buildRecordedDetails,
  scrubIntentForLocalLog,
} from "../src/action-governance.js"

describe("ActionIntent governance with audit minimization", () => {
  it("builds a slim ActionPolicy with audit_mode minimal", () => {
    const policy = buildProcurementActionPolicy()
    expect(policy.audit_mode).toBe("minimal")
    expect(policy.allowed_action_types).toContain("purchase")
  })

  it("redacts secret-shaped keys from record details", () => {
    const details = buildRecordedDetails({
      outcome: "executed",
      api_key: "sk-live-should-not-persist",
      note: "ok",
    })
    expect(details).toBeDefined()
    expect(details!.outcome).toBe("executed")
    expect(details!.note).toBe("ok")
    expect(details!.api_key).toBe("[REDACTED]")
  })

  it("scrubs query strings from intent resources for local logs", () => {
    const policy = buildProcurementActionPolicy()
    const intent = buildPurchaseIntent({
      policyId: policy.policy_id,
      resource: "https://vendor.example/buy?token=secret",
      amountMinor: 2500,
    })
    const scrubbed = scrubIntentForLocalLog(intent)
    expect(scrubbed.resource).not.toContain("token=")
  })
})
