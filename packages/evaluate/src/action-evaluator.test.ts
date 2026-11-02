import { describe, expect, it } from "vitest"

import { evaluateActionIntent } from "./action-evaluator.js"

const intent = {
  intent_id: "22222222-2222-4222-8222-222222222222",
  policy_id: "11111111-1111-4111-8111-111111111111",
  agent_id: "agent_demo",
  action_type: "refund",
  resource: "orders/123",
  issued_at: new Date().toISOString(),
}

const policy = {
  policy_id: intent.policy_id,
  version: 1,
  organization_id: "org_demo",
  agent_id: "*",
  allowed_action_types: ["refund"],
  status: "active" as const,
  updated_at: new Date().toISOString(),
}

describe("evaluateActionIntent", () => {
  it("allows an intent matching an active policy", () => {
    expect(evaluateActionIntent(intent, policy)).toMatchObject({
      approved: true,
      decision: "allow",
      reasons: [],
    })
  })

  it("denies an intent outside the allowed action types", () => {
    expect(evaluateActionIntent(
      { ...intent, action_type: "delete" },
      policy,
    )).toMatchObject({
      approved: false,
      decision: "deny",
    })
  })

  it("requires approval when the policy matches an approval rule", () => {
    expect(evaluateActionIntent(
      { ...intent, cost: { amount_minor: 100, currency: "USD" } },
      { ...policy, approval_cost_minor: 100 },
    )).toMatchObject({
      approved: false,
      decision: "approval_required",
    })
  })
})
