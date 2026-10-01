import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { includeDocsRootParam, resolveDocsSlug } from "./docs-routing"

describe("docs routing", () => {
  it("resolves the docs root to the introduction page", () => {
    assert.deepEqual(resolveDocsSlug(undefined), ["introduction"])
    assert.deepEqual(resolveDocsSlug([]), ["introduction"])
  })

  it("preserves requested docs paths", () => {
    assert.deepEqual(resolveDocsSlug(["server", "operations"]), ["server", "operations"])
  })

  it("includes the docs root in static route params", () => {
    const params = [{ slug: ["introduction"] }, { slug: ["quick-start"] }]

    assert.deepEqual(includeDocsRootParam(params), [
      { slug: [] },
      ...params,
    ])
  })
})
