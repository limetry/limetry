"use client"

/**
 * Interactive Limetry docs RAG chat (citations + teach-me prompts).
 */

import Link from "next/link"
import { useState } from "react"

import {
  askDocs,
  type DocsChatSource,
  docsHrefForSource,
} from "@/lib/docs-chat"

type Turn = {
  role: "user" | "assistant"
  content: string
  sources?: DocsChatSource[]
  backend?: string
}

const STARTERS = [
  "How do I get started with the Limetry SDK?",
  "How do I self-host the Limetry server?",
  "Explain Limetry architecture at a high level",
  "What does data minimization mean for audit logs?",
]

/**
 * Docs assistant chat panel.
 *
 * @returns Chat UI.
 */
export function DocsAskChat(): React.JSX.Element {
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [turns, setTurns] = useState<Turn[]>([])

  async function send(message: string): Promise<void> {
    const trimmed = message.trim()
    if (!trimmed || busy) {
      return
    }
    setBusy(true)
    setError(null)
    setInput("")
    const history = turns.map((turn) => ({ role: turn.role, content: turn.content }))
    setTurns((previous) => [...previous, { role: "user", content: trimmed }])
    try {
      const result = await askDocs(trimmed, history)
      setTurns((previous) => [
        ...previous,
        {
          role: "assistant",
          content: result.answer,
          sources: result.sources,
          backend: result.backend,
        },
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chat failed")
      setTurns((previous) => previous.slice(0, -1))
      setInput(trimmed)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        {STARTERS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-raised)] px-3 py-1.5 text-left text-sm text-[var(--text-secondary)] hover:border-[var(--brand)] hover:text-[var(--text-main)]"
            disabled={busy}
            onClick={() => void send(prompt)}
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className="flex min-h-[22rem] flex-col gap-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
        {turns.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">
            Ask how to use, deploy, or understand Limetry. Answers cite documentation sources.
          </p>
        ) : null}
        {turns.map((turn, index) => (
          <div
            key={`${turn.role}-${index}`}
            className={turn.role === "user" ? "ml-8" : "mr-4"}
          >
            <div
              className={`rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${turn.role === "user"
                  ? "bg-[var(--brand-soft)] text-[var(--text-main)]"
                  : "bg-[var(--bg-subtle)] text-[var(--text-main)]"
                }`}
            >
              {turn.content}
            </div>
            {turn.sources && turn.sources.length > 0 ? (
              <ul className="mt-2 space-y-1 text-xs text-[var(--text-muted)]">
                {turn.sources.slice(0, 5).map((source) => {
                  const href = docsHrefForSource(source.sourcePath)
                  return (
                    <li key={source.id}>
                      {href ? (
                        <Link className="text-[var(--brand-ink)] underline-offset-2 hover:underline" href={href}>
                          {source.sourcePath}
                        </Link>
                      ) : (
                        <span>{source.sourcePath}</span>
                      )}
                      {source.section ? ` · ${source.section}` : ""}
                    </li>
                  )
                })}
                {turn.backend ? (
                  <li className="text-[var(--text-muted)]">backend: {turn.backend}</li>
                ) : null}
              </ul>
            ) : null}
          </div>
        ))}
        {busy ? <p className="text-sm text-[var(--text-muted)]">Searching docs…</p> : null}
        {error ? <p className="text-sm text-[var(--danger-ink)]">{error}</p> : null}
      </div>

      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault()
          void send(input)
        }}
      >
        <input
          className="min-w-0 flex-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-raised)] px-3 py-2 text-sm text-[var(--text-main)] outline-none focus:border-[var(--brand)]"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask about Limetry…"
          disabled={busy}
          aria-label="Ask Limetry docs"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-[var(--brand-fg)] disabled:opacity-50"
        >
          Ask
        </button>
      </form>
    </div>
  )
}
