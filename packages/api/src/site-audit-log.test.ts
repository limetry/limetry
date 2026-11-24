import { describe, expect, it, vi } from "vitest"

import {
  putSiteAuditEvent,
  resolveSiteAuditHost,
  resolveSiteAuditRetentionDays,
  siteTenantId,
  truncateSiteMetadata,
  tryPutSiteAuditEvent,
} from "./site-audit-log.js"

describe("siteTenantId", () => {
  it("builds site:{host}:{channel} partitions", () => {
    expect(siteTenantId("limetry.org", "assistant")).toBe("site:limetry.org:assistant")
    expect(siteTenantId("limetry.com", "contact")).toBe("site:limetry.com:contact")
  })

  it("normalizes host casing and scheme", () => {
    expect(siteTenantId("HTTPS://Limetry.ORG/", "contact")).toBe("site:limetry.org:contact")
  })

  it("rejects empty host", () => {
    expect(() => siteTenantId("  ", "assistant")).toThrow(/non-empty host/)
  })
})

describe("resolveSiteAuditHost / retention", () => {
  it("defaults host to limetry.org and retention to 90", () => {
    expect(resolveSiteAuditHost({})).toBe("limetry.org")
    expect(resolveSiteAuditRetentionDays({})).toBe(90)
  })

  it("reads env overrides", () => {
    expect(resolveSiteAuditHost({ SITE_AUDIT_HOST: "limetry.com" })).toBe("limetry.com")
    expect(resolveSiteAuditRetentionDays({ SITE_AUDIT_RETENTION_DAYS: "14" })).toBe(14)
  })
})

describe("truncateSiteMetadata", () => {
  it("passes through small payloads", () => {
    const meta = { message: "hi", answer: "hello" }
    expect(truncateSiteMetadata(meta)).toEqual(meta)
  })

  it("truncates oversized string fields", () => {
    const meta = { message: "x".repeat(10_000) }
    const out = truncateSiteMetadata(meta, 3_000)
    expect(out._truncated).toBe(true)
    expect(String(out.message).length).toBeLessThan(meta.message.length)
  })
})

describe("putSiteAuditEvent", () => {
  it("no-ops when AUDIT_LOG_TABLE is unset", async () => {
    const previous = process.env.AUDIT_LOG_TABLE
    delete process.env.AUDIT_LOG_TABLE
    const send = vi.fn()
    try {
      const result = await putSiteAuditEvent(
        {
          tenantId: "site:limetry.org:assistant",
          action: "assistant.chat",
          resourceType: "assistant",
          retentionDays: 90,
          metadata: { message: "hi" },
        },
        { client: { send } as never },
      )
      expect(result).toBeNull()
      expect(send).not.toHaveBeenCalled()
    } finally {
      if (previous === undefined) {
        delete process.env.AUDIT_LOG_TABLE
      } else {
        process.env.AUDIT_LOG_TABLE = previous
      }
    }
  })

  it("Puts an item with ISO#id SK and TTL from retentionDays", async () => {
    const send = vi.fn().mockResolvedValue({})
    const createdAt = "2026-11-24T12:00:00.000Z"
    const result = await putSiteAuditEvent(
      {
        tenantId: "site:limetry.org:contact",
        action: "contact.submit",
        resourceType: "contact",
        retentionDays: 90,
        id: "audit_test",
        createdAt,
        metadata: { email: "a@b.com" },
      },
      { tableName: "limetry-cloud-audit-log-dev", client: { send } as never },
    )

    expect(result).toEqual({ id: "audit_test", createdAt })
    expect(send).toHaveBeenCalledTimes(1)
    const command = send.mock.calls[0][0]
    const item = command.input.Item
    expect(item.tenant_id.S).toBe("site:limetry.org:contact")
    expect(item.sk.S).toBe("2026-11-24T12:00:00.000Z#audit_test")
    expect(item.action.S).toBe("contact.submit")
    expect(item.ttl.N).toBe(String(
      Math.floor(new Date(createdAt).getTime() / 1000) + 90 * 24 * 60 * 60,
    ))
    expect(JSON.parse(item.metadata.S)).toEqual({ email: "a@b.com" })
  })

  it("tryPutSiteAuditEvent swallows Put failures", async () => {
    const send = vi.fn().mockRejectedValue(new Error("boom"))
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    await expect(
      tryPutSiteAuditEvent(
        {
          tenantId: "site:limetry.org:assistant",
          action: "assistant.chat",
          resourceType: "assistant",
          retentionDays: 90,
        },
        { tableName: "t", client: { send } as never },
      ),
    ).resolves.toBeUndefined()
    expect(errorSpy).toHaveBeenCalled()
    errorSpy.mockRestore()
  })
})
