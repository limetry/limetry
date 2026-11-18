import { describe, expect, it } from "vitest"

import {
  citationLabel,
  docsHrefForSource,
  enrichSources,
  normalizeSourcePath,
  snapSnippet,
} from "./citations.js"

describe("rag citations", () => {
  it("maps docs MDX and package READMEs to site hrefs", () => {
    expect(docsHrefForSource("packages/web/content/docs/quick-start.mdx")).toBe("/docs/quick-start")
    expect(docsHrefForSource("packages/mcp/README.md")).toBe("/docs/mcp")
    expect(docsHrefForSource("SECURITY.md")).toBe("/docs/server/data-minimization")
  })

  it("normalizes S3 plain corpus paths", () => {
    expect(
      normalizeSourcePath("s3://bucket/docs/ai-rag/corpus/plain/SECURITY.md__abc123def456.txt"),
    ).toBe("SECURITY.md")
  })

  it("hides chunk jargon from labels", () => {
    expect(citationLabel({
      title: "Install",
      sourcePath: "INSTALL.md",
      section: "chunk-2",
    })).toBe("Install")
  })

  it("snaps snippets away from mid-token cuts", () => {
    const snippet = snapSnippet(`${"word ".repeat(80)}record_action runs client-side`, 40)
    expect(snippet).not.toMatch(/^ecord_action/)
    expect(snippet.endsWith("…")).toBe(true)
  })

  it("enriches sources with href and product", () => {
    const [source] = enrichSources([{
      id: "1",
      title: "Security",
      sourcePath: "SECURITY.md",
      section: "chunk-1",
      snippet: "Data minimization keeps audit small.",
      score: 1,
    }])
    expect(source?.href).toBe("/docs/server/data-minimization")
    expect(source?.section).toBeUndefined()
    expect(source?.product).toBe("oss")
  })
})
