import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { parseDocsRegenArgs } from "./docs-regen.js"

describe("docs regen CLI", () => {
  it("parses help and mode flags", () => {
    assert.deepEqual(parseDocsRegenArgs(["--help"]), {
      help: true,
      openapiOnly: false,
      skipOpenapi: false,
    })
    assert.deepEqual(parseDocsRegenArgs(["--openapi-only"]), {
      help: false,
      openapiOnly: true,
      skipOpenapi: false,
    })
    assert.deepEqual(parseDocsRegenArgs(["--skip-openapi"]), {
      help: false,
      openapiOnly: false,
      skipOpenapi: true,
    })
  })
})
