import assert from "node:assert/strict"
import { describe, it } from "node:test"

/**
 * Mirrors legacyDnsResourceName without Pulumi runtime.
 */
function formatLegacyDnsResourceName(
  project: string,
  stack: string,
  suffix: string,
): string {
  return `${project}-${stack}-${suffix}`
}

/**
 * Dedupes validation FQDNs the same way shared ACM adoption does.
 */
function dedupeValidationFqdns(
  webNames: string[],
  apiNames: string[],
): { createKinds: string[], reusedApi: number } {
  const byFqdn = new Map<string, string>()
  const createKinds: string[] = []
  for (const name of webNames) {
    if (!byFqdn.has(name)) {
      byFqdn.set(name, "web")
      createKinds.push("web")
    }
  }
  let reusedApi = 0
  for (const name of apiNames) {
    if (byFqdn.has(name)) {
      reusedApi += 1
      continue
    }
    byFqdn.set(name, "api")
    createKinds.push("api")
  }
  return { createKinds, reusedApi }
}

describe("upsert dns legacy names", () => {
  it("maps pre-rename Pulumi logical names", () => {
    assert.equal(
      formatLegacyDnsResourceName("limetry-oss", "dev", "web-acm-0"),
      "limetry-oss-dev-web-acm-0",
    )
    assert.equal(
      formatLegacyDnsResourceName("limetry-oss", "dev", "cf-web"),
      "limetry-oss-dev-cf-web",
    )
  })
})

describe("shared acm validation dedupe", () => {
  it("reuses a shared validation hostname across certs", () => {
    const result = dedupeValidationFqdns(
      ["_aaa.example.com", "_bbb.api.example.com"],
      ["_bbb.api.example.com"],
    )
    assert.deepEqual(result.createKinds, ["web", "web"])
    assert.equal(result.reusedApi, 1)
  })
})
