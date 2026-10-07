import { describe, expect, it } from "vitest"

import {
  API_PORT,
  API_VERSION,
  buildApiDnsAnnotations,
  buildApiDocumentationUrls,
  buildApiImageTag,
  buildApiUrl,
  buildSecretResourceName,
  normalizeApiDomain,
  resolvePersistence,
} from "./config"

describe("cloud stack configuration", () => {
  it("normalizes configured API domains", () => {
    expect(normalizeApiDomain("https://api.example.test/")).toBe("api.example.test")
    expect(normalizeApiDomain("  api.example.test  ")).toBe("api.example.test")
    expect(normalizeApiDomain("")).toBeUndefined()
    expect(normalizeApiDomain("https://")).toBeUndefined()
  })

  it("builds stable image references with stack defaults", () => {
    expect(buildApiImageTag("limetry", "dev")).toBe("limetry-server:pulumi-dev")
    expect(buildApiImageTag("limetry", "dev", "registry.example/limetry/api", "branch-7"))
      .toBe("registry.example/limetry/api:branch-7")
  })

  it("builds DNS annotations only for configured domains", () => {
    expect(buildApiDnsAnnotations(undefined, "limetry.org")).toEqual({})
    expect(buildApiDnsAnnotations("api.example.test", "example.test")).toEqual({
      "external-dns.alpha.kubernetes.io/hostname": "api.example.test",
      "external-dns.alpha.kubernetes.io/ttl": "300",
      "limetry.org/api-domain-zone": "example.test",
    })
  })

  it("builds configured and provider-assigned API URLs", () => {
    expect(buildApiUrl("api.example.test", undefined)).toBe("https://api.example.test")
    expect(buildApiUrl(undefined, "203.0.113.10")).toBe("http://203.0.113.10")
    expect(buildApiUrl(undefined, undefined)).toBeUndefined()
  })

  it("builds versioned API documentation URLs", () => {
    expect(buildApiDocumentationUrls(undefined)).toBeUndefined()
    expect(buildApiDocumentationUrls("https://api.example.test")).toEqual({
      docs: "https://api.example.test/v1/docs",
      openApiJson: "https://api.example.test/v1/openapi.json",
      openApiYaml: "https://api.example.test/v1/openapi.yaml",
    })
  })

  it("resolves the supported storage modes", () => {
    expect(resolvePersistence(false)).toBe("sqlite")
    expect(resolvePersistence(true)).toBe("postgres")
  })

  it("keeps fixed API version and secret resource contracts", () => {
    expect(API_PORT).toBe(3810)
    expect(API_VERSION).toBe("v1")
    expect(buildSecretResourceName("limetry", "decisionHmacSecret"))
      .toBe("limetry-decisionHmacSecret")
  })
})
