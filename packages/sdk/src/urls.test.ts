import { describe, expect, it } from "vitest"

import {
  DEFAULT_LIMETRY_BASE_URL,
  DEFAULT_LIMETRY_CLOUD_BASE_URL,
  LIMETRY_CLOUD_ORIGINS,
  LIMETRY_OSS_ORIGINS,
  resolveLimetryBaseUrl,
  resolveLimetryCloudBaseUrl,
} from "./urls.js"

describe("resolveLimetryBaseUrl", () => {
  it("uses the OSS production API when env is unset", () => {
    expect(resolveLimetryBaseUrl({})).toBe(LIMETRY_OSS_ORIGINS.api)
    expect(DEFAULT_LIMETRY_BASE_URL).toBe("https://api.limetry.org")
  })

  it("prefers LIMETRY_BASE_URL and strips trailing slashes", () => {
    expect(resolveLimetryBaseUrl({ LIMETRY_BASE_URL: "https://api.example.com/" })).toBe(
      "https://api.example.com",
    )
  })

  it("prefers an explicit override", () => {
    expect(
      resolveLimetryBaseUrl({ LIMETRY_BASE_URL: "https://ignored.example.com" }, "https://override.example.com"),
    ).toBe("https://override.example.com")
  })

  it("ignores blank env values", () => {
    expect(resolveLimetryBaseUrl({ LIMETRY_BASE_URL: "   " })).toBe(LIMETRY_OSS_ORIGINS.api)
    expect(resolveLimetryBaseUrl({}, "  ")).toBe(LIMETRY_OSS_ORIGINS.api)
  })
})

describe("LIMETRY_CLOUD_ORIGINS", () => {
  it("points the hosted API at api.app.limetry.com", () => {
    expect(LIMETRY_CLOUD_ORIGINS.api).toBe("https://api.app.limetry.com")
    expect(LIMETRY_CLOUD_ORIGINS.web).toBe("https://limetry.com")
  })
})

describe("resolveLimetryCloudBaseUrl", () => {
  it("uses the Cloud BFF default when env is unset", () => {
    expect(resolveLimetryCloudBaseUrl({})).toBe(DEFAULT_LIMETRY_CLOUD_BASE_URL)
  })

  it("prefers LIMETRY_CLOUD_BASE_URL over hosted public URLs", () => {
    expect(
      resolveLimetryCloudBaseUrl({
        LIMETRY_CLOUD_BASE_URL: "https://bff.example.com/",
        HOSTED_PUBLIC_API_URL: "https://ignored.example.com",
      }),
    ).toBe("https://bff.example.com")
  })
})
