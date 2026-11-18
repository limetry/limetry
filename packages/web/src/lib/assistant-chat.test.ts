import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  assistantCitationLabel,
  assistantHrefForSource,
  normalizeAssistantSourcePath,
  resolveSourceHref,
} from "./assistant-chat.ts"

describe("assistantHrefForSource", () => {
  it("maps content docs paths to /docs routes", () => {
    assert.equal(
      assistantHrefForSource("packages/web/content/docs/quick-start.mdx"),
      "/docs/quick-start",
    )
  })

  it("maps root guides and package READMEs to sensible docs pages", () => {
    assert.equal(assistantHrefForSource("SECURITY.md"), "/docs/server/data-minimization")
    assert.equal(assistantHrefForSource("packages/mcp/README.md"), "/docs/mcp")
  })

  it("returns null for unknown paths", () => {
    assert.equal(assistantHrefForSource("packages/sdk/src/index.ts"), null)
  })

  it("normalizes S3 plain paths", () => {
    assert.equal(
      normalizeAssistantSourcePath("s3://bucket/docs/assistant/corpus/plain/INSTALL.md__abcdef12.txt"),
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
      assistantCitationLabel({
        title: "Data minimization",
        sourcePath: "SECURITY.md",
        section: "chunk-3",
      }),
      "Data minimization",
    )
  })

  it("does not map enterprise README to OSS introduction", () => {
    assert.equal(
      normalizeAssistantSourcePath("limetry-enterprise/README.md"),
      "limetry-enterprise/README.md",
    )
    assert.equal(assistantHrefForSource("limetry-enterprise/README.md"), null)
    assert.equal(
      resolveSourceHref({
        id: "ent",
        title: "Limetry Cloud",
        sourcePath: "limetry-enterprise/README.md",
        snippet: "",
        score: 1,
      }),
      null,
    )
  })

  it("replaces Bedrock plain-corpus artifact titles", () => {
    assert.equal(
      assistantCitationLabel({
        title: "SECURITY.md__abcdef12.txt",
        sourcePath: "docs/assistant/corpus/plain/SECURITY.md__abcdef12.txt",
      }),
      "SECURITY",
    )
  })
})
