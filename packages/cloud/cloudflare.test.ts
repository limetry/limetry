import { describe, expect, it } from "vitest"

import { normalizeDnsName } from "./cloudflare"

/** Verifies Kubernetes Cloudflare record normalization. */
describe("Kubernetes Cloudflare helpers", () => {
  /** Verifies provider endpoint values become stable hostnames. */
  it("normalizes provider endpoint names", () => {
    expect(normalizeDnsName("https://LB.Example.com./")).toBe("lb.example.com")
  })
})
