"use client"

/**
 * Floating Limetry product assistant (FAB + glass chat panel).
 */

import Link from "next/link"
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import {
  askAssistantStream,
  type AssistantChatSource,
  assistantCitationLabel,
  resolveSourceHref,
} from "@/lib/assistant-chat"

type Turn = {
  role: "user" | "assistant"
  content: string
  sources?: AssistantChatSource[]
}

const STARTERS = [
  "How do I get started?",
  "How do I self-host?",
  "Explain the architecture",
  "What is data minimization?",
]

/**
 * Chat bubble icon for the launcher.
 *
 * @returns SVG element.
 */
function ChatIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="size-6">
      <path
        d="M8.5 18.5 5 21v-3.5A7.5 7.5 0 1 1 12 19.5c-1.2 0-2.4-.3-3.5-1Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M8.75 11.25h6.5M8.75 14h4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}

/**
 * Close (X) icon.
 *
 * @returns SVG element.
 */
function CloseIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="size-4">
      <path
        d="M6 6l12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}

/**
 * Send arrow icon.
 *
 * @returns SVG element.
 */
function SendIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="size-4">
      <path
        d="M5 12h12M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * Renders assistant markdown with compact prose styles.
 *
 * @param props - Markdown source.
 * @returns Rendered markdown.
 */
function AssistantMarkdown({ content }: { content: string }): React.JSX.Element {
  return (
    <div className="
      ask-limetry-markdown
      dark:prose-invert
      prose max-w-none prose-sm
      prose-headings:mt-3 prose-headings:mb-2
      prose-p:my-2
      prose-code:text-[0.85em]
      prose-pre:my-2
      prose-ol:my-2
      prose-ul:my-2
      prose-li:my-0.5
    ">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  )
}

/**
 * Floating product assistant: lower-right FAB that opens a translucent chat panel.
 *
 * @returns Chat launcher + panel portal content.
 */
export function AskLimetryChat(): React.JSX.Element {
  const panelId = useId()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [turns, setTurns] = useState<Turn[]>([])
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const close = useCallback(() => setOpen(false), [])
  const toggle = useCallback(() => setOpen((value) => !value), [])

  useEffect(() => {
    if (!open) {
      return
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close()
      }
    }
    window.addEventListener("keydown", onKey)
    const timer = window.setTimeout(() => inputRef.current?.focus(), 80)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.clearTimeout(timer)
    }
  }, [open, close])

  useEffect(() => {
    const node = listRef.current
    if (!node) {
      return
    }
    node.scrollTop = node.scrollHeight
  }, [turns, busy, open])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }
    const params = new URLSearchParams(window.location.search)
    if (params.get("ask") === "1" || window.location.hash === "#ask-docs") {
      setOpen(true)
    }
  }, [])

  async function send(message: string): Promise<void> {
    const trimmed = message.trim()
    if (!trimmed || busy) {
      return
    }
    setBusy(true)
    setError(null)
    setInput("")
    const history = turns.map((turn) => ({ role: turn.role, content: turn.content }))
    setTurns((previous) => [
      ...previous,
      { role: "user", content: trimmed },
      { role: "assistant", content: "", sources: [] },
    ])
    try {
      await askAssistantStream(trimmed, history, {
        onMeta: ({ sources }) => {
          setTurns((previous) => {
            const next = [...previous]
            const last = next[next.length - 1]
            if (last?.role === "assistant") {
              next[next.length - 1] = { ...last, sources }
            }
            return next
          })
        },
        onDelta: (text) => {
          setTurns((previous) => {
            const next = [...previous]
            const last = next[next.length - 1]
            if (last?.role === "assistant") {
              next[next.length - 1] = {
                ...last,
                content: `${last.content}${text}`,
              }
            }
            return next
          })
        },
        onError: (message) => {
          setError(message)
        },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chat failed")
      let rolledBack = false
      setTurns((previous) => {
        const last = previous[previous.length - 1]
        if (last?.role === "assistant" && last.content.trim().length > 0) {
          return previous
        }
        rolledBack = true
        return previous.slice(0, -2)
      })
      if (rolledBack) {
        setInput(trimmed)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-60 flex justify-end p-4 sm:p-5">
      <div className="pointer-events-auto flex flex-col items-end gap-3">
        {open ? (
          <section
            id={panelId}
            role="dialog"
            aria-modal="false"
            aria-label="Ask Limetry"
            className="
              ask-limetry-panel flex w-[min(100vw-2rem,24rem)] flex-col overflow-hidden rounded-2xl
              border border-border bg-card shadow-2xl shadow-black/10
              dark:shadow-black/40
            "
          >
            <header className="
              flex items-center justify-between gap-3 border-b border-border px-4 py-3
            ">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold tracking-tight text-foreground">
                  Ask Limetry
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  Product guide · grounded answers
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                className="
                  inline-flex size-8 items-center justify-center rounded-full text-muted-foreground
                  transition
                  hover:bg-muted/70 hover:text-foreground
                "
                aria-label="Close chat"
              >
                <CloseIcon />
              </button>
            </header>

            <div
              ref={listRef}
              className="flex max-h-[min(28rem,55vh)] min-h-64 flex-col gap-3 overflow-y-auto p-3"
            >
              {turns.length === 0 ? (
                <div className="space-y-3 px-1 py-2">
                  <p className="text-sm/relaxed text-muted-foreground">
                    Ask how to use, deploy, or understand Limetry and Limetry Cloud. I answer conversationally and cite the docs.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {STARTERS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        disabled={busy}
                        onClick={() => void send(prompt)}
                        className="
                          rounded-full border border-border bg-muted px-2.5 py-1 text-left text-xs
                          text-foreground/80 transition
                          hover:border-primary/50 hover:bg-primary/10 hover:text-foreground
                          disabled:opacity-50
                        "
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {turns.map((turn, index) => (
                <div
                  key={`${turn.role}-${index}`}
                  className={`flex ${turn.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[92%] rounded-2xl px-3 py-2 text-sm/relaxed ${turn.role === "user"
                      ? "rounded-br-md bg-primary whitespace-pre-wrap text-primary-foreground"
                      : "rounded-bl-md border border-border bg-muted text-foreground"
                    }`}
                  >
                    {turn.role === "assistant" ? (
                      turn.content
                        ? <AssistantMarkdown content={turn.content} />
                        : (
                          <span className="text-xs text-muted-foreground">
                              Thinking…
                          </span>
                        )
                    ) : turn.content}
                    {turn.sources && turn.sources.length > 0 ? (
                      <ul className="
                        mt-2 space-y-1 border-t border-border/40 pt-2 text-[11px]
                        text-muted-foreground
                      ">
                        {turn.sources.slice(0, 4).map((source) => {
                          const href = resolveSourceHref(source)
                          const label = assistantCitationLabel(source)
                          return (
                            <li key={source.id} className="truncate">
                              {href ? (
                                <Link
                                  href={href}
                                  className="text-primary underline-offset-2 hover:underline"
                                  onClick={close}
                                >
                                  {label}
                                </Link>
                              ) : (
                                <span>{label}</span>
                              )}
                              {source.section ? ` · ${source.section}` : ""}
                            </li>
                          )
                        })}
                      </ul>
                    ) : null}
                  </div>
                </div>
              ))}

              {busy && turns[turns.length - 1]?.role !== "assistant" ? (
                <div className="flex justify-start">
                  <div className="
                    rounded-2xl rounded-bl-md border border-border bg-muted px-3 py-2 text-xs
                    text-muted-foreground
                  ">
                    Thinking…
                  </div>
                </div>
              ) : null}
              {error ? (
                <p className="px-1 text-xs text-destructive">{error}</p>
              ) : null}
            </div>

            <form
              className="border-t border-border p-3"
              onSubmit={(event) => {
                event.preventDefault()
                void send(input)
              }}
            >
              <div className="
                flex items-center gap-2 rounded-xl border border-border bg-background px-2 py-1.5
                focus-within:border-primary/50
              ">
                <input
                  ref={inputRef}
                  className="
                    min-w-0 flex-1 bg-transparent p-1.5 text-sm text-foreground outline-none
                    placeholder:text-muted-foreground
                  "
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ask about Limetry…"
                  disabled={busy}
                  aria-label="Ask Limetry"
                />
                <button
                  type="submit"
                  disabled={busy || !input.trim()}
                  className="
                    inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary
                    text-primary-foreground transition
                    hover:opacity-90
                    disabled:opacity-40
                  "
                  aria-label="Send message"
                >
                  <SendIcon />
                </button>
              </div>
            </form>
          </section>
        ) : null}

        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          aria-label={open ? "Close Ask Limetry" : "Ask Limetry"}
          className="
            ask-limetry-fab inline-flex size-12 items-center justify-center rounded-full
            hover:scale-[1.03]
            active:scale-[0.98]
          "
        >
          {open ? <CloseIcon /> : <ChatIcon />}
        </button>
      </div>
    </div>
  )
}
