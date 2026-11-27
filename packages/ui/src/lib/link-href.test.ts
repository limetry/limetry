import { describe, expect, it } from "vitest"

import {
  isAbsoluteHttpHref,
  isExternalHref,
  isLimetryFamilyHref,
} from "./link-href"

describe("link-href helpers", () => {
  it("keeps Limetry product origins in-family", () => {
    expect(isLimetryFamilyHref("https://limetry.org/docs")).toBe(true)
    expect(isLimetryFamilyHref("https://api.limetry.org/openapi")).toBe(true)
    expect(isLimetryFamilyHref("https://api.limetry.com/v1")).toBe(true)
    expect(isLimetryFamilyHref("https://app.limetry.com/pricing")).toBe(true)
    expect(isLimetryFamilyHref("http://localhost:3810/openapi")).toBe(true)
    expect(isLimetryFamilyHref("/docs/quick-start")).toBe(true)
  })

  it("marks only third-party absolute URLs as external", () => {
    expect(isExternalHref("https://limetry.org/docs")).toBe(false)
    expect(isExternalHref("https://api.limetry.com/openapi")).toBe(false)
    expect(isExternalHref("http://127.0.0.1:3800/contact")).toBe(false)
    expect(isExternalHref("/examples")).toBe(false)
    expect(isExternalHref("https://github.com/limetry/limetry")).toBe(true)
    expect(isExternalHref("https://discord.gg/VxUWz7cZP")).toBe(true)
    expect(isExternalHref("mailto:hello@limetry.org")).toBe(true)
  })

  it("detects absolute http(s) hrefs", () => {
    expect(isAbsoluteHttpHref("https://api.limetry.org")).toBe(true)
    expect(isAbsoluteHttpHref("/openapi")).toBe(false)
    expect(isAbsoluteHttpHref("mailto:hello@limetry.org")).toBe(false)
  })
})
