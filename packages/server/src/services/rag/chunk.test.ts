import { describe, expect, it } from "vitest"

import { chunkText, stripMdx, titleFromDoc } from "./chunk.js"

describe("rag chunk helpers", () => {
  it("strips MDX frontmatter and tags", () => {
    const text = stripMdx("---\ntitle: X\n---\n\n# Hello\n\nimport x from \"y\"\n\n<Callout>Hi</Callout>\n\nBody.")
    expect(text).toContain("Hello")
    expect(text).toContain("Body")
    expect(text).not.toContain("frontmatter")
    expect(text).not.toContain("<Callout>")
  })

  it("chunks with overlap", () => {
    const input = "a".repeat(3_000)
    const chunks = chunkText(input, 1_000, 100)
    expect(chunks.length).toBeGreaterThan(2)
    expect(chunks[0]?.length).toBeLessThanOrEqual(1_000)
  })

  it("reads title from heading", () => {
    expect(titleFromDoc("docs/x.md", "# Install\n\nsteps")).toBe("Install")
  })
})
