"use client"

/**
 * Modal site search dialog over docs, examples, blog, and static pages.
 */

import Link from "next/link"
import { useCallback, useEffect, useId, useRef, useState } from "react"

import { matchStaticEntries, type SearchSection, type SiteSearchHit, type StaticSearchEntry } from "@/lib/site-search-index"

const SECTION_LABELS: Record<SearchSection, string> = {
  docs: "Docs",
  examples: "Examples",
  blog: "Blog",
  site: "Site",
}

/**
 * Props for {@link SiteSearchDialog}.
 */
type SiteSearchDialogProps = {
  /**
   * Whether the dialog is visible.
   */
  open: boolean
  /**
   * Open-state change callback.
   *
   * @param open - Next open state.
   */
  onOpenChange: (open: boolean) => void
}

/**
 * Full-screen search overlay; fetches `/api/search` and matches client-side.
 *
 * @param props - Open state and change handler.
 * @returns Dialog element, or `null` when closed.
 */
export function SiteSearchDialog({
  open,
  onOpenChange,
}: SiteSearchDialogProps): React.JSX.Element | null {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState("")
  const [catalog, setCatalog] = useState<StaticSearchEntry[] | null>(null)
  const [hits, setHits] = useState<SiteSearchHit[]>([])
  const [loading, setLoading] = useState(false)

  const close = useCallback((): void => {
    onOpenChange(false)
  }, [onOpenChange])

  useEffect(() => {
    if (!open) {
      return
    }

    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus()
    })

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        close()
      }
    }

    document.addEventListener("keydown", onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, close])

  useEffect(() => {
    if (!open || catalog) {
      return
    }

    const controller = new AbortController()
    void fetch("/api/search", { signal: controller.signal })
      .then(async (response) => {
        const data = (await response.json()) as { entries?: StaticSearchEntry[] }
        return Array.isArray(data.entries) ? data.entries : []
      })
      .then((entries) => {
        setCatalog(entries)
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return
        }
        setCatalog([])
      })

    return () => {
      controller.abort()
    }
  }, [open, catalog])

  useEffect(() => {
    if (!open) {
      return
    }

    const trimmed = query.trim()
    if (trimmed.length < 2) {
      queueMicrotask(() => {
        setHits([])
        setLoading(false)
      })
      return
    }

    if (!catalog) {
      queueMicrotask(() => {
        setLoading(true)
      })
      return
    }

    const nextHits = matchStaticEntries(trimmed, catalog)
    queueMicrotask(() => {
      setHits(nextHits)
      setLoading(false)
    })
  }, [open, query, catalog])

  if (!open) {
    return null
  }

  const grouped = (Object.keys(SECTION_LABELS) as SearchSection[]).map((section) => ({
    section,
    label: SECTION_LABELS[section],
    items: hits.filter((hit) => hit.section === section),
  })).filter((group) => group.items.length > 0)

  return (
    <div
      className="fixed inset-x-0 bottom-0 top-16 z-40"
      role="dialog"
      aria-modal="true"
      aria-labelledby={inputId}
    >
      <button
        type="button"
        aria-label="Close search"
        className="absolute inset-0 bg-background/50 backdrop-blur-md"
        onClick={close}
      />

      <div className="pointer-events-none absolute inset-x-0 top-6 flex justify-center px-4 sm:top-10 md:top-[12vh]">
        <div className="pointer-events-auto w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/20">
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <SearchGlyph className="h-4 w-4 shrink-0 text-muted-foreground" />
            <label htmlFor={inputId} className="sr-only">
              Search Limetry
            </label>
            <input
              id={inputId}
              ref={inputRef}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
              }}
              placeholder="Search docs, examples, blog, and site…"
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            <kbd className="hidden rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">
              Esc
            </kbd>
          </div>

          <div className="max-h-[min(60vh,420px)] overflow-y-auto p-2">
            {loading ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">Searching…</p>
            ) : null}
            {!loading && query.trim().length >= 2 && grouped.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                No results for “{query.trim()}”
              </p>
            ) : null}
            {!loading && query.trim().length < 2 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                Type at least 2 characters to search the site.
              </p>
            ) : null}
            {grouped.map((group) => (
              <div key={group.section} className="mb-2">
                <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {group.label}
                </p>
                <ul className="flex flex-col gap-0.5">
                  {group.items.map((hit) => (
                    <li key={hit.id}>
                      <Link
                        href={hit.url}
                        onClick={close}
                        {...(hit.url.startsWith("http")
                          ? { target: "_blank", rel: "noopener noreferrer" }
                          : {})}
                        className="block rounded-xl px-3 py-2.5 transition-colors hover:bg-muted"
                      >
                        <span className="block text-sm font-semibold text-foreground">
                          {hit.title}
                        </span>
                        {hit.description ? (
                          <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">
                            {hit.description}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function SearchGlyph({ className }: { className?: string }): React.JSX.Element {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
      />
    </svg>
  )
}
