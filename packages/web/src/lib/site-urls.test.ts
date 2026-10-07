import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { isExternalHref } from "./site-urls"

describe("siteUrls client-safe env reads", () => {
  it("uses static NEXT_PUBLIC_* property accesses so Next can inline client URLs", async () => {
    const source = await import("node:fs").then((fs) =>
      fs.readFileSync(new URL("./site-urls.ts", import.meta.url), "utf8"),
    )
    assert.match(source, /process\.env\.NEXT_PUBLIC_APP_URL/)
    assert.match(source, /process\.env\.NEXT_PUBLIC_WEB_URL/)
    assert.match(source, /process\.env\.NEXT_PUBLIC_API_URL/)
    assert.doesNotMatch(source, /firstEnvUrl\(\s*process\.env\s*,/)
    assert.doesNotMatch(
      source,
      /app:\s*clientSafeOrigin\(\s*firstEnvUrl/,
    )
  })
})

describe("isExternalHref", () => {
  it("keeps Limetry and localhost links in the current window", () => {
    assert.equal(isExternalHref("https://limetry.org/docs"), false)
    assert.equal(isExternalHref("https://api.limetry.com/openapi"), false)
    assert.equal(isExternalHref("https://app.limetry.com/connect"), false)
    assert.equal(isExternalHref("http://localhost:3830/connect"), false)
    assert.equal(isExternalHref("/docs/quick-start"), false)
  })

  it("identifies unrelated HTTP links as external", () => {
    assert.equal(isExternalHref("https://github.com/limetry/limetry"), true)
    assert.equal(isExternalHref("https://discord.gg/VxUWz7cZP"), true)
  })
})
