import { describe, expect, it } from "vitest"

import {
  bearerProbeResult,
  classifyHealthBody,
  defaultCloudPortalUrl,
  isLoopbackBaseUrl,
} from "./probe.js"

describe("setup probe", () => {
  it("classifies Cloud and OSS health payloads", () => {
    expect(classifyHealthBody({ service: "limetry-enterprise-server" })).toBe("cloud")
    expect(classifyHealthBody({ service: "limetry-server" })).toBe("oss")
    expect(classifyHealthBody({ ok: true })).toBe("unknown")
  })

  it("treats only authenticated success as a usable bearer token", () => {
    expect(bearerProbeResult(200)).toBe("valid")
    expect(bearerProbeResult(401)).toBe("invalid")
    expect(bearerProbeResult(403)).toBe("invalid")
    expect(bearerProbeResult(500)).toBe("unreachable")
  })

  it("defaults a loopback API to the local portal", () => {
    expect(isLoopbackBaseUrl("http://localhost:3820")).toBe(true)
    expect(defaultCloudPortalUrl("http://localhost:3820")).toBe("http://localhost:3830")
    expect(defaultCloudPortalUrl("https://api.limetry.com")).toBe("https://app.limetry.com")
  })
})
