/**
 * Document title branding for the public site.
 */

import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { documentTitle } from "./document-title"

describe("documentTitle", () => {
  it("prefixes the page name with Limetry", () => {
    assert.deepEqual(documentTitle("Stop irreversible agent side effects"), {
      absolute: "Limetry — Stop irreversible agent side effects",
    })
  })
})
