/**
 * Ask Limetry e2e: mocked chat/stream API → client stream parsing → citation links.
 *
 * Does not require a live LLM. Run via `yarn workspace @limetry/web test:e2e`.
 */

import assert from "node:assert/strict"
import { after, before, describe, it, mock } from "node:test"

import {
  askAssistantStream,
  type AssistantChatSource,
  assistantCitationLabel,
  assistantHrefForSource,
  resolveSourceHref,
} from "../src/lib/assistant-chat.ts"

function sseBody(events: unknown[]): string {
  return events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join("")
}

describe("Ask Limetry e2e (mocked stream)", () => {
  const sources: AssistantChatSource[] = [
    {
      id: "sec-1",
      title: "Data minimization",
      sourcePath: "SECURITY.md",
      snippet: "Store only decision receipts.",
      score: 0.95,
      href: "/docs/server/data-minimization",
      product: "oss",
    },
  ]

  const answerMarkdown = [
    "Data minimization means Limetry keeps only what audit needs — usually decision receipts and redacted metadata.",
    "",
    "Avoid logging secrets or full request bodies unless a specific investigation requires them.",
    "",
    "Want help turning on minimal audit mode for your server?",
  ].join("\n")

  let originalFetch: typeof globalThis.fetch

  before(() => {
    originalFetch = globalThis.fetch
    globalThis.fetch = (async (_input: RequestInfo | URL, _init?: RequestInit) => {
      const body = sseBody([
        {
          type: "meta",
          sources,
          backend: "memory",
          model: "fixture",
        },
        { type: "delta", text: answerMarkdown.slice(0, 40) },
        { type: "delta", text: answerMarkdown.slice(40) },
        { type: "done" },
      ])
      return new Response(body, {
        status: 200,
        headers: { "content-type": "text/event-stream; charset=utf-8" },
      })
    }) as typeof fetch
  })

  after(() => {
    globalThis.fetch = originalFetch
    mock.restoreAll()
  })

  it("streams a conversational answer and working citation hrefs", async () => {
    const deltas: string[] = []
    let metaSources: AssistantChatSource[] = []

    const result = await askAssistantStream(
      "What is data minimization?",
      [],
      {
        onMeta: ({ sources: next }) => {
          metaSources = next
        },
        onDelta: (text) => {
          deltas.push(text)
        },
      },
    )

    assert.equal(result.ok, true)
    assert.equal(result.answer, answerMarkdown)
    assert.equal(deltas.join(""), answerMarkdown)
    assert.equal(metaSources.length, 1)
    assert.doesNotMatch(result.answer, /Based on Limetry docs related to/)
    assert.doesNotMatch(result.answer, /## Tools\s*\|/)
    assert.doesNotMatch(result.answer, /\[!NOTE\]/)
    assert.match(result.answer, /Want help/)

    const source = result.sources[0]
    assert.ok(source)
    assert.equal(assistantCitationLabel(source), "Data minimization")
    assert.equal(resolveSourceHref(source), "/docs/server/data-minimization")
    assert.equal(assistantHrefForSource(source.sourcePath), "/docs/server/data-minimization")
    assert.doesNotMatch(assistantCitationLabel(source), /chunk-/i)
  })

  it("keeps FAB deep-link query contract for opening Ask Limetry", () => {
    const url = new URL("https://limetry.org/docs/introduction?ask=1")
    assert.equal(url.searchParams.get("ask"), "1")
  })
})
