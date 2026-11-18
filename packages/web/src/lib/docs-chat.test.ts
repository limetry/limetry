import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  docsCitationLabel,
  docsHrefForSource,
  normalizeDocsSourcePath,
  resolveSourceHref,
} from "./docs-chat.ts"

describe("docsHrefForSource", () => {
  it("maps content docs paths to /docs routes", () => {
    assert.equal(
      docsHrefForSource("packages/web/content/docs/quick-start.mdx"),
      "/docs/quick-start",
    )
  })

  it("maps root guides and package READMEs to sensible docs pages", () => {
    assert.equal(docsHrefForSource("SECURITY.md"), "/docs/server/data-minimization")
    assert.equal(docsHrefForSource("packages/mcp/README.md"), "/docs/mcp")
  })

  it("returns null for unknown paths", () => {
    assert.equal(docsHrefForSource("packages/sdk/src/index.ts"), null)
  })

  it("normalizes S3 plain paths", () => {
    assert.equal(
      normalizeDocsSourcePath("s3://bucket/docs/ai-rag/corpus/plain/INSTALL.md__abcdef12.txt"),
      "INSTALL.md",
    )
  })

  it("prefers API href and human titles", () => {
    assert.equal(
      resolveSourceHref({
        id: "1",
        title: "Data minimization",
        sourcePath: "SECURITY.md",
        snippet: "",
        score: 1,
        href: "/docs/server/data-minimization",
      }),
      "/docs/server/data-minimization",
    )
    assert.equal(
      docsCitationLabel({
        title: "Data minimization",
        sourcePath: "SECURITY.md",
        section: "chunk-3",
      }),
      "Data minimization",
    )
  })
})
