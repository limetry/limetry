import { describe, expect, it } from "vitest"

import {
  chunkText,
  normalizeDocText,
  sourcePriority,
  stripMdx,
  titleFromDoc,
} from "./chunk.js"

describe("rag chunk helpers", () => {
  it("strips MDX frontmatter and tags", () => {
    const text = stripMdx("---\ntitle: X\n---\n\n# Hello\n\nimport x from \"y\"\n\n<Callout>Hi</Callout>\n\nBody.")
    expect(text).toContain("Hello")
    expect(text).toContain("Body")
    expect(text).not.toContain("frontmatter")
    expect(text).not.toContain("<Callout>")
  })

  it("flattens markdown tables and callouts", () => {
    const text = normalizeDocText([
      "# Tools",
      "",
      "> [!NOTE]",
      "> Origin story stays internal.",
      "",
      "| Tool | Purpose |",
      "| --- | --- |",
      "| limetry_evaluate | Allow / deny |",
      "",
      "Done.",
    ].join("\n"))
    expect(text).not.toContain("[!NOTE]")
    expect(text).not.toContain("| --- |")
    expect(text).toContain("limetry_evaluate")
    expect(text).toContain("Origin story stays internal")
  })

  it("chunks on heading and word boundaries", () => {
    const input = [
      "# One",
      "alpha beta gamma ".repeat(40),
      "# Two",
      "delta epsilon zeta ".repeat(40),
    ].join("\n")
    const chunks = chunkText(input, 180, 20)
    expect(chunks.length).toBeGreaterThan(1)
    for (const chunk of chunks) {
      expect(chunk.startsWith("lpha ")).toBe(false)
      expect(chunk.startsWith("psilon ")).toBe(false)
    }
  })

  it("advances past oversized tokens instead of looping forever", () => {
    const longToken = "x".repeat(1_500)
    const chunks = chunkText(`${longToken} trailing words here`, 1_200, 200)
    expect(chunks.length).toBeGreaterThan(0)
    expect(chunks.join("")).toContain("trailing")
  })

  it("reads title from heading", () => {
    expect(titleFromDoc("docs/x.md", "# Install\n\nsteps")).toBe("Install")
  })

  it("prefers official docs over package READMEs", () => {
    expect(sourcePriority("packages/web/content/docs/quick-start.mdx")).toBeGreaterThan(
      sourcePriority("packages/sql/README.md"),
    )
  })
})
