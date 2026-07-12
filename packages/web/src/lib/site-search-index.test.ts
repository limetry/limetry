import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { clientSearchCatalog, matchStaticEntries } from "./site-search-index.ts"

describe("site search catalog", () => {
  it("matches example and site pages from the client catalog", () => {
    const hits = matchStaticEntries("shopify", clientSearchCatalog())
    assert.ok(hits.some((hit) => hit.url.includes("shopify")))
  })

  it("returns no hits for a one-character query", () => {
    assert.deepEqual(matchStaticEntries("s", clientSearchCatalog()), [])
  })
})
