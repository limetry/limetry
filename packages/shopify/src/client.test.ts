import { describe, expect, it, vi } from "vitest"

import { ShopifyActionFirewall } from "./client.js"
import { createShopifyActionPolicy } from "./templates.js"

describe("createShopifyActionPolicy", () => {
  it("requires approval for refunds by default", () => {
    const policy = createShopifyActionPolicy({
      agentId: "shopify_agent",
      maxRefundMinor: 2500,
    })
    expect(policy.require_approval_action_types).toContain("shopify.refund")
    expect(policy.allowed_action_types).toContain("shopify.discount")
  })
})

describe("ShopifyActionFirewall", () => {
  it("blocks Admin calls when approval is required", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (String(url).includes("/v1/policy/evaluate")) {
        return {
          ok: true,
          json: async () => ({
            ok: true,
            approved: false,
            decision: "approval_required",
            reasons: ["refund needs review"],
            decision_id: "dec-1",
            approval_id: "appr-1",
          }),
        }
      }
      throw new Error("Admin API should not be called")
    }) as unknown as typeof fetch

    const firewall = new ShopifyActionFirewall({
      shopDomain: "acme.myshopify.com",
      adminToken: "shpat_test",
      apiKey: "token",
      baseUrl: "http://localhost:3810",
      policyId: "11111111-1111-4111-8111-111111111111",
      dryRun: false,
      fetch: fetchMock,
    })

    const result = await firewall.createRefund({
      orderId: "123",
      amountMinor: 5000,
    })

    expect(result.executed).toBe(false)
    expect(result.evaluation.approval_id).toBe("appr-1")
    expect(result.intent.action_type).toBe("shopify.refund")
  })

  it("executes Admin mutations only after allow and dryRun false", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (String(url).includes("/v1/policy/evaluate")) {
        return {
          ok: true,
          json: async () => ({
            ok: true,
            approved: true,
            decision: "allow",
            reasons: [],
            decision_id: "dec-2",
          }),
        }
      }
      return {
        ok: true,
        json: async () => ({ inventory_level: { available: 7 } }),
      }
    }) as unknown as typeof fetch

    const firewall = new ShopifyActionFirewall({
      shopDomain: "acme.myshopify.com",
      adminToken: "shpat_test",
      apiKey: "token",
      baseUrl: "http://localhost:3810",
      policyId: "11111111-1111-4111-8111-111111111111",
      dryRun: false,
      fetch: fetchMock,
    })

    const result = await firewall.updateInventory({
      inventoryItemId: "1",
      locationId: "2",
      available: 7,
    })

    expect(result.executed).toBe(true)
    expect(result.response).toEqual({ inventory_level: { available: 7 } })
  })

  it("creates discounts in dry-run without Admin calls", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (String(url).includes("/v1/policy/evaluate")) {
        return {
          ok: true,
          json: async () => ({
            ok: true,
            approved: true,
            decision: "allow",
            reasons: [],
            decision_id: "dec-3",
          }),
        }
      }
      throw new Error("Admin API should not be called in dry-run")
    }) as unknown as typeof fetch

    const firewall = new ShopifyActionFirewall({
      shopDomain: "acme.myshopify.com",
      adminToken: "shpat_test",
      apiKey: "token",
      baseUrl: "http://localhost:3810",
      policyId: "11111111-1111-4111-8111-111111111111",
      dryRun: true,
      fetch: fetchMock,
    })

    const result = await firewall.createDiscount({
      title: "SPRING10",
      percentOff: 10,
    })

    expect(result.executed).toBe(false)
    expect(result.intent.action_type).toBe("shopify.discount")
  })
})
