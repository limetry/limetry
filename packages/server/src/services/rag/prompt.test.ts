import { describe, expect, it } from "vitest"

import {
  extractiveAnswer,
  formatContext,
  isLegacyExtractiveTemplate,
  RAG_SYSTEM_PROMPT,
} from "./prompt.js"
import type { RagSource } from "./types.js"

const sampleSources: RagSource[] = [
  {
    id: "1",
    title: "Data minimization",
    sourcePath: "SECURITY.md",
    snippet: "## Tools | Tool | Purpose | | --- | --- | secret body",
    score: 0.9,
    href: "/docs/server/data-minimization",
  },
]

describe("rag prompt helpers", () => {
  it("describes a conversational product assistant", () => {
    expect(RAG_SYSTEM_PROMPT).toMatch(/Ask Limetry/)
    expect(RAG_SYSTEM_PROMPT).toMatch(/summary/i)
    expect(RAG_SYSTEM_PROMPT).toMatch(/follow-up/i)
    expect(RAG_SYSTEM_PROMPT).not.toMatch(/documentation assistant only/i)
  })

  it("never pastes raw snippets in the fallback answer", () => {
    const answer = extractiveAnswer("What is data minimization?", sampleSources)
    expect(answer).not.toMatch(/Based on Limetry docs related to/)
    expect(answer).not.toContain("## Tools")
    expect(answer).not.toContain("secret body")
    expect(answer).toMatch(/try again|specific question|getting started/i)
  })

  it("detects the legacy extractive template", () => {
    expect(isLegacyExtractiveTemplate('Based on Limetry docs related to "x":')).toBe(true)
    expect(isLegacyExtractiveTemplate("Data minimization means storing less.")).toBe(false)
  })

  it("formats context with titles and hrefs", () => {
    const context = formatContext(sampleSources)
    expect(context).toContain("[#1 Data minimization")
    expect(context).toContain("url: /docs/server/data-minimization")
    expect(context).not.toMatch(/chunk-/i)
  })
})
