import { describe, expect, it } from "vitest"

import { maskSecret, redactDatabaseUrl } from "./mask.js"

describe("maskSecret", () => {
  it("returns unset for empty values", () => {
    expect(maskSecret(undefined)).toBe("(unset)")
    expect(maskSecret("")).toBe("(unset)")
  })

  it("keeps known secret prefixes", () => {
    expect(maskSecret("sk_live_placeholder")).toBe("sk_live_••••••••••")
    expect(maskSecret("pk_test_placeholder")).toBe("pk_test_••••••••••")
    expect(maskSecret("whsec_placeholder")).toBe("whsec_••••••••••")
    expect(maskSecret("sk-example-openai-key")).toBe("sk-••••••••••")
  })

  it("masks generic secrets without leaking the value", () => {
    expect(maskSecret("test-bearer-token-at-least-16")).toBe("••••••••••")
    expect(maskSecret("test-bearer-token-at-least-16")).not.toContain("test-bearer")
  })
})

describe("redactDatabaseUrl", () => {
  it("strips credentials and keeps host plus database name", () => {
    const redacted = redactDatabaseUrl("postgresql://appuser:secret@db.example.com:5432/appdb")
    expect(redacted.display).toBe("postgresql://db.example.com:5432/appdb")
    expect(redacted.endpoint).toBe("postgresql://db.example.com:5432")
    expect(redacted.name).toBe("appdb")
  })

  it("handles invalid URLs", () => {
    const redacted = redactDatabaseUrl("not-a-url")
    expect(redacted.display).toBe("(invalid)")
    expect(redacted.endpoint).toBe("(invalid)")
    expect(redacted.name).toBe("(none)")
  })
})
