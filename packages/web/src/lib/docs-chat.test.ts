import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { docsHrefForSource } from "./docs-chat.ts"

describe("docsHrefForSource", () => {
  it("maps content docs paths to /docs routes", () => {
    assert.equal(
      docsHrefForSource("packages/web/content/docs/quick-start.mdx"),
      "/docs/quick-start",
    )
  })

  it("maps root guides to sensible docs pages", () => {
    assert.equal(docsHrefForSource("SECURITY.md"), "/docs/server/data-minimization")
  })

  it("returns null for unknown paths", () => {
    assert.equal(docsHrefForSource("packages/sdk/src/index.ts"), null)
  })
})
