import { describe, expect, it } from "vitest"

import { normalizeDnsName } from "./cloudflare"

/** Verifies serverless Cloudflare record normalization. */
describe("serverless Cloudflare helpers", () => {
  /** Verifies provider DNS names become stable absolute names. */
  it("normalizes DNS names", () => {
    expect(normalizeDnsName(" HTTPS://API.Example.com./health ")).toBe("api.example.com")
  })
})
