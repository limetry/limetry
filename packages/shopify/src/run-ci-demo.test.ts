import { describe, expect, it, vi } from "vitest"

import { runShopifyCiDemo } from "./run-ci-demo.js"

function mockEvaluate(decision: "allow" | "deny", reasons: string[] = []) {
  return vi.fn(async (url: string) => {
    if (String(url).includes("/v1/policy/evaluate")) {
      return {
        ok: true,
        json: async () => ({
          ok: true,
          approved: decision === "allow",
          decision,
          reasons,
          decision_id: "dec-shopify-ci",
        }),
      }
    }
    throw new Error("Shopify Admin API should not be called in the CI demo")
  }) as unknown as typeof fetch
}

const baseEnv = {
  INPUT_LIMETRY_API_KEY: "token",
  INPUT_POLICY_ID: "33333333-3333-4333-8333-333333333333",
  INPUT_LIMETRY_BASE_URL: "http://localhost:3810",
}

describe("runShopifyCiDemo", () => {
  it("returns 1 when api key or policy id is missing", async () => {
    expect(await runShopifyCiDemo({})).toBe(1)
  })

  it("allows a $10 dry-run refund", async () => {
    const code = await runShopifyCiDemo(
      { ...baseEnv, INPUT_ACTION: "refund" },
      { fetch: mockEvaluate("allow") },
    )
    expect(code).toBe(0)
  })

  it("denies a $500 refund over the cost ceiling", async () => {
    const code = await runShopifyCiDemo(
      { ...baseEnv, INPUT_ACTION: "large_refund" },
      { fetch: mockEvaluate("deny", ["cost 50000 exceeds max_cost_minor 2500"]) },
    )
    expect(code).toBe(1)
  })

  it("denies inventory wipes without calling Admin API", async () => {
    const fetchMock = mockEvaluate("deny", ["action_type shopify.inventory is denied"])
    const code = await runShopifyCiDemo(
      { ...baseEnv, INPUT_ACTION: "inventory" },
      { fetch: fetchMock },
    )
    expect(code).toBe(1)
    expect(fetchMock).toHaveBeenCalledOnce()
  })
})
