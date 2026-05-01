import { createSlimActionPolicy } from "@limetry/sdk"
import { describe, expect, it } from "vitest"

import type { ActionIntent } from "../schemas/action.js"
import { evaluateActionIntent } from "../services/action-evaluator.js"
import { matchesResourcePattern } from "../services/resource-match.js"

function sampleIntent(overrides: Partial<ActionIntent> = {}): ActionIntent {
  return {
    intent_id: "22222222-2222-4222-8222-222222222222",
    policy_id: "11111111-1111-4111-8111-111111111111",
    agent_id: "agent_demo",
    action_type: "http_post",
    resource: "https://prod.example.com/api/deploy",
    issued_at: new Date().toISOString(),
    ...overrides,
  }
}

describe("action-evaluator", () => {
  it("verifies allowed action intents pass policy checks", () => {
    const policy = createSlimActionPolicy({
      agentId: "agent_demo",
      allowedActionTypes: ["http_post"],
      allowedResourcePatterns: ["https://prod.example.com/*"],
      policyId: "11111111-1111-4111-8111-111111111111",
    })

    const result = evaluateActionIntent(sampleIntent(), policy)

    expect(result.approved).toBe(true)
    expect(result.reasons).toHaveLength(0)
    expect(result.decision_id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    )
  })

  it("denies intents when action_type is blocked", () => {
    const policy = createSlimActionPolicy({
      agentId: "agent_demo",
      allowedActionTypes: ["http_post"],
      deniedActionTypes: ["http_post"],
      policyId: "11111111-1111-4111-8111-111111111111",
    })

    const result = evaluateActionIntent(sampleIntent(), policy)

    expect(result.approved).toBe(false)
    expect(result.reasons.some((reason) => reason.includes("denied"))).toBe(true)
  })

  it("denies intents when resource matches a blocked pattern", () => {
    const policy = createSlimActionPolicy({
      agentId: "agent_demo",
      allowedActionTypes: ["http_post"],
      blockedResourcePatterns: ["https://prod.example.com/*"],
      policyId: "11111111-1111-4111-8111-111111111111",
    })

    const result = evaluateActionIntent(sampleIntent(), policy)

    expect(result.approved).toBe(false)
    expect(result.reasons.some((reason) => reason.includes("blocked pattern"))).toBe(true)
  })

  it("denies intents when cost exceeds max_cost_minor", () => {
    const policy = createSlimActionPolicy({
      agentId: "agent_demo",
      allowedActionTypes: ["spend"],
      maxCostMinor: 1_000,
      policyId: "11111111-1111-4111-8111-111111111111",
    })

    const result = evaluateActionIntent(
      sampleIntent({
        action_type: "spend",
        cost: { amount_minor: 2_000, currency: "USD" },
      }),
      policy,
    )

    expect(result.approved).toBe(false)
    expect(result.reasons.some((reason) => reason.includes("max_cost_minor"))).toBe(true)
  })

  it("matches wildcard resource patterns with prefix semantics", () => {
    expect(matchesResourcePattern(
      "https://prod.example.com/api/deploy",
      "https://prod.example.com/*",
    )).toBe(true)
    expect(matchesResourcePattern(
      "https://staging.example.com/api/deploy",
      "https://prod.example.com/*",
    )).toBe(false)
  })

  it("returns approval_required when action type is gated", () => {
    const policy = createSlimActionPolicy({
      agentId: "agent_demo",
      allowedActionTypes: ["deploy"],
      requireApprovalActionTypes: ["deploy"],
      policyId: "11111111-1111-4111-8111-111111111111",
    })

    const result = evaluateActionIntent(
      sampleIntent({ action_type: "deploy" }),
      policy,
    )

    expect(result.approved).toBe(false)
    expect(result.decision).toBe("approval_required")
  })
})
