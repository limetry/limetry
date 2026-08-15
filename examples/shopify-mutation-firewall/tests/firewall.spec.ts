import { describe, expect, it, vi } from "vitest"

import { createStoreFirewall } from "../src/agent-support.js"
import { dispatchSupportOpsTool, SUPPORT_OPS_TOOLS } from "../src/support-ops-agent.js"

function mockFetchByUrl(
  evaluateBody: Record<string, unknown>,
  shopifyBody?: Record<string, unknown>,
): ReturnType<typeof vi.fn> {
  return vi.fn(async (url: string | URL | Request) => {
    const urlStr = url.toString()
    if (urlStr.includes("/v1/policy/evaluate") || urlStr.includes("/v1/actions/evaluate")) {
      return new Response(JSON.stringify(evaluateBody), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }
    if (urlStr.includes("myshopify.com") && shopifyBody) {
      return new Response(JSON.stringify(shopifyBody), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      })
    }
    return new Response("Not found", { status: 404 })
  })
}

describe("Shopify support / ops agent", () => {
  it("registers refund, discount, and inventory tools", () => {
    expect(SUPPORT_OPS_TOOLS.map((tool) => tool.function.name)).toEqual([
      "issue_customer_refund",
      "create_goodwill_discount",
      "set_inventory_level",
    ])
  })

  it("allows and executes a $10 goodwill refund", async () => {
    const mockFetch = mockFetchByUrl(
      {
        ok: true,
        approved: true,
        decision: "allow",
        decision_id: "dec-shop-allow",
        reasons: [],
      },
      { refund: { id: 98765, order_id: 1234, note: "limetry-governed-refund" } },
    )

    const firewall = createStoreFirewall({
      apiKey: "test-shopify-api-key",
      adminToken: "shpat_test_token",
      fetch: mockFetch as unknown as typeof fetch,
      dryRun: false,
    })

    const result = await dispatchSupportOpsTool(firewall, "issue_customer_refund", {
      orderId: "1234",
      amountDollars: 10,
    })

    expect(result.decision).toBe("allow")
    expect(result.executed).toBe(true)
    expect(result.success).toBe(true)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it("denies inventory wipes before Shopify Admin is contacted", async () => {
    const mockFetch = mockFetchByUrl({
      ok: true,
      approved: false,
      decision: "deny",
      reasons: ["action_type shopify.inventory is not in allowed_action_types"],
    })

    const firewall = createStoreFirewall({
      apiKey: "test-shopify-api-key",
      adminToken: "shpat_test_token",
      fetch: mockFetch as unknown as typeof fetch,
      dryRun: false,
    })

    const result = await dispatchSupportOpsTool(firewall, "set_inventory_level", {
      inventoryItemId: "inv_1",
      locationId: "loc_1",
      available: 0,
    })

    expect(result.decision).toBe("deny")
    expect(result.executed).toBe(false)
    expect(result.reasons[0]).toContain("shopify.inventory")
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it("returns approval_required for a $25 refund and does not mutate the store", async () => {
    const mockFetch = mockFetchByUrl({
      ok: true,
      approved: false,
      decision: "approval_required",
      approval_id: "approval-refund-25",
      reasons: ["cost 2500 meets approval_cost_minor 2500"],
    })

    const firewall = createStoreFirewall({
      apiKey: "test-shopify-api-key",
      adminToken: "shpat_test_token",
      fetch: mockFetch as unknown as typeof fetch,
      dryRun: false,
    })

    const result = await dispatchSupportOpsTool(firewall, "issue_customer_refund", {
      orderId: "1234",
      amountDollars: 25,
    })

    expect(result.decision).toBe("approval_required")
    expect(result.executed).toBe(false)
    expect(result.approval_id).toBe("approval-refund-25")
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it("blocks refunds that exceed max_cost_minor", async () => {
    const mockFetch = mockFetchByUrl({
      ok: true,
      approved: false,
      decision: "deny",
      reasons: ["cost 15000 exceeds max_cost_minor 5000"],
    })

    const firewall = createStoreFirewall({
      apiKey: "test-shopify-api-key",
      adminToken: "shpat_test_token",
      fetch: mockFetch as unknown as typeof fetch,
      dryRun: false,
    })

    const result = await dispatchSupportOpsTool(firewall, "issue_customer_refund", {
      orderId: "1234",
      amountDollars: 150,
    })

    expect(result.decision).toBe("deny")
    expect(result.executed).toBe(false)
    expect(result.reasons[0]).toContain("cost 15000 exceeds max_cost_minor 5000")
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it("allows a goodwill discount in dry-run without mutating the store", async () => {
    const mockFetch = mockFetchByUrl({
      ok: true,
      approved: true,
      decision: "allow",
    })

    const firewall = createStoreFirewall({
      apiKey: "test-shopify-api-key",
      adminToken: "shpat_test_token",
      fetch: mockFetch as unknown as typeof fetch,
      dryRun: true,
    })

    const result = await dispatchSupportOpsTool(firewall, "create_goodwill_discount", {
      title: "VIP10",
      percentOff: 10,
    })

    expect(result.decision).toBe("allow")
    expect(result.executed).toBe(false)
    expect(result.mutationResult.dryRun).toBe(true)
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })
})
