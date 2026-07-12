import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { docsMdxComponents } from "./docs-mdx-components"

describe("docs MDX components", () => {
  it("maps Mintlify callout, card, and step names onto Fumadocs primitives", () => {
    assert.equal(typeof docsMdxComponents.Note, "function")
    assert.equal(typeof docsMdxComponents.Info, "function")
    assert.equal(typeof docsMdxComponents.Tip, "function")
    assert.equal(typeof docsMdxComponents.Warning, "function")
    assert.equal(typeof docsMdxComponents.Danger, "function")
    assert.equal(typeof docsMdxComponents.Check, "function")
    assert.equal(docsMdxComponents.CardGroup, docsMdxComponents.Cards)
    assert.equal(typeof docsMdxComponents.Steps, "function")
    assert.equal(typeof docsMdxComponents.Step, "function")
  })
})
