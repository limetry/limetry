import assert from "node:assert/strict"
import { mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, it } from "node:test"

import { hashDirectory } from "./content-hash.ts"
import {
  cloudflareTrafficHints,
  dnsRecordFqdn,
  hostnameFromTarget,
  inferCloudflareZoneName,
  ossPublicUrls,
  relativeRecordName,
  shouldManageWww,
  stripTrailingDot,
} from "./dns-names.ts"

describe("OSS DNS names", () => {
  it("infers the Cloudflare zone from a preview hostname", () => {
    assert.equal(inferCloudflareZoneName("dev.limetry.org"), "limetry.org")
    assert.equal(inferCloudflareZoneName("limetry.org"), "limetry.org")
    assert.equal(inferCloudflareZoneName("api.limetry.com."), "limetry.com")
  })

  it("builds relative Cloudflare record names for nested hosts", () => {
    assert.equal(relativeRecordName("dev.limetry.org", "limetry.org"), "dev")
    assert.equal(relativeRecordName("api.dev.limetry.org", "limetry.org"), "api.dev")
    assert.equal(relativeRecordName("limetry.org", "limetry.org"), "@")
    assert.equal(relativeRecordName("www.limetry.org", "limetry.org"), "www")
  })

  it("only attaches www on the zone apex", () => {
    assert.equal(shouldManageWww("limetry.org", "limetry.org"), true)
    assert.equal(shouldManageWww("dev.limetry.org", "limetry.org"), false)
  })

  it("exports the public product URLs including the marketing host", () => {
    const urls = ossPublicUrls({
      apiHostname: "api.dev.limetry.org",
      portalHostname: "app.dev.limetry.org",
      domain: "dev.limetry.org",
      includeWww: false,
    })
    assert.equal(urls.web, "https://dev.limetry.org")
    assert.equal(urls.api, "https://api.dev.limetry.org")
    assert.equal(urls.app, "https://app.dev.limetry.org")
    assert.equal(urls.webWww, undefined)
  })

  it("builds Cloudflare CNAME hints with nested names not @/www/api", () => {
    const hints = cloudflareTrafficHints({
      apiHostname: "api.dev.limetry.org",
      apiTarget: "https://pr295az7rl.execute-api.us-west-2.amazonaws.com/",
      domain: "dev.limetry.org",
      includeWww: false,
      proxied: false,
      webTarget: "d3h8nb9o86gtb1.cloudfront.net",
      zoneName: "limetry.org",
    })
    assert.deepEqual(hints, [
      {
        type: "CNAME",
        name: "dev",
        content: "d3h8nb9o86gtb1.cloudfront.net",
        proxied: false,
      },
      {
        type: "CNAME",
        name: "api.dev",
        content: "pr295az7rl.execute-api.us-west-2.amazonaws.com",
        proxied: false,
      },
    ])
  })

  it("normalizes ACM and invoke-url hosts", () => {
    assert.equal(stripTrailingDot("_abc.dev.limetry.org."), "_abc.dev.limetry.org")
    assert.equal(dnsRecordFqdn("_abc.dev.limetry.org."), "_abc.dev.limetry.org")
    assert.equal(
      hostnameFromTarget("https://pr295az7rl.execute-api.us-west-2.amazonaws.com/"),
      "pr295az7rl.execute-api.us-west-2.amazonaws.com",
    )
  })
})

describe("web dist hashing", () => {
  it("changes the hash when a file changes", () => {
    const dir = mkdtempSync(join(tmpdir(), "limetry-web-hash-"))
    writeFileSync(join(dir, "index.html"), "<h1>one</h1>")
    const first = hashDirectory(dir)
    writeFileSync(join(dir, "index.html"), "<h1>two</h1>")
    const second = hashDirectory(dir)
    assert.notEqual(first, second)
    assert.equal(first.length, 16)
  })
})
