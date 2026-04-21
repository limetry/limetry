import { describe, expect, it } from "vitest"

import { createSlimPolicy } from "./slim-policy.js"

describe("createSlimPolicy", () => {
  it("builds an active SpendingPolicy from USD limits", () => {
    const policy = createSlimPolicy({
      agentId: "agent_a",
      maxSingleTransactionMinor: 5_000,
      maxDailySpendMinor: 25_000,
      allowedMerchantIds: ["m1"],
      policyId: "11111111-1111-4111-8111-111111111111",
    })

    expect(policy.agent_id).toBe("agent_a")
    expect(policy.policy_id).toBe("11111111-1111-4111-8111-111111111111")
    expect(policy.limits.max_single_transaction_minor).toBe(5_000)
    expect(policy.destination_rules.require_merchant_allowlist).toBe(true)
    expect(policy.status).toBe("active")
  })
})
