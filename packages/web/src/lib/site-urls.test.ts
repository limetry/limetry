import assert from "node:assert/strict"
import { describe, it } from "node:test"

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
