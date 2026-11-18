/**
 * Client helpers for the Limetry product RAG chat UI.
 */

import { siteUrls } from "@/lib/site-urls"

/** One citation returned by `POST /v1/chat`. */
export type DocsChatSource = {
  id: string
  title: string
  sourcePath: string
  section?: string
  snippet: string
  score: number
  product?: "oss" | "cloud"
  href?: string
}

/** Successful chat API payload. */
export type DocsChatResponse = {
  ok: true
  answer: string
  sources: DocsChatSource[]
  backend: string
  model?: string
}

const DOCS_PREFIX = "packages/web/content/docs/"

const ROOT_GUIDE_HREFS: Record<string, string> = {
  "README.md": "/docs/introduction",
  "INSTALL.md": "/docs/server/self-hosting",
  "USAGE.md": "/docs/quick-start",
  "SECURITY.md": "/docs/server/data-minimization",
}

const PACKAGE_README_HREFS: Record<string, string> = {
  "packages/sdk/README.md": "/docs/sdk",
  "packages/mcp/README.md": "/docs/mcp",
  "packages/sql/README.md": "/docs/sql",
  "packages/server/README.md": "/docs/server/architecture",
  "packages/ci/README.md": "/docs/ci",
  "packages/evaluate/README.md": "/docs/quick-start",
}

/**
 * Normalizes corpus / Bedrock / S3-style source paths.
 *
 * @param sourcePath - Raw path from the API.
 * @returns Normalized path.
 */
export function normalizeDocsSourcePath(sourcePath: string): string {
  let normalized = sourcePath.replace(/\\/g, "/").trim()
  const s3Match = normalized.match(/^s3:\/\/[^/]+\/(.+)$/i)
  if (s3Match?.[1]) {
    normalized = s3Match[1]
  }
  normalized = normalized.replace(/^\/+/, "")
  const plainPrefix = "docs/ai-rag/corpus/plain/"
  if (normalized.startsWith(plainPrefix)) {
    const leaf = normalized.slice(plainPrefix.length)
    normalized = leaf
      .replace(/__[a-f0-9]{8,}(?:\.txt)?$/i, "")
      .replace(/\.txt$/i, "")
      .replace(/__/g, "/")
  }
  if (normalized.startsWith("limetry-enterprise/")) {
    normalized = normalized.slice("limetry-enterprise/".length)
  }
  return normalized
}

/**
 * Maps a corpus source path to an in-site docs href when possible.
 *
 * @param sourcePath - Repo-relative path from the RAG corpus.
 * @returns Site-relative docs URL or null.
 */
export function docsHrefForSource(sourcePath: string): string | null {
  const normalized = normalizeDocsSourcePath(sourcePath)
  if (normalized.startsWith(DOCS_PREFIX)) {
    const rest = normalized.slice(DOCS_PREFIX.length).replace(/\.mdx?$/i, "")
    if (rest === "index" || rest.endsWith("/index")) {
      return "/docs"
    }
    return `/docs/${rest}`
  }
  if (ROOT_GUIDE_HREFS[normalized]) {
    return ROOT_GUIDE_HREFS[normalized]
  }
  if (PACKAGE_README_HREFS[normalized]) {
    return PACKAGE_README_HREFS[normalized]
  }
  return null
}

/**
 * Human citation label without chunk jargon.
 *
 * @param source - Chat source.
 * @returns Display title.
 */
export function docsCitationLabel(source: Pick<DocsChatSource, "title" | "sourcePath" | "section">): string {
  const title = source.title?.trim()
  if (title && !/^chunk-\d+$/i.test(title)) {
    return title
  }
  const path = normalizeDocsSourcePath(source.sourcePath)
  const base = path.split("/").pop() ?? path
  return base.replace(/\.(mdx?|ya?ml|json|txt)$/i, "")
}

/**
 * Resolves the best href for a source (API href wins when present).
 *
 * @param source - Chat source.
 * @returns Href or null.
 */
export function resolveSourceHref(source: DocsChatSource): string | null {
  if (source.href) {
    return source.href
  }
  return docsHrefForSource(source.sourcePath)
}

type StreamHandlers = {
  onMeta?: (meta: { sources: DocsChatSource[], backend: string, model?: string }) => void
  onDelta?: (text: string) => void
  onDone?: () => void
}

/**
 * Calls the Limetry server docs chat endpoint (non-streaming).
 *
 * @param message - User question.
 * @param history - Prior turns.
 * @returns Parsed chat response.
 */
export async function askDocs(
  message: string,
  history: Array<{ role: "user" | "assistant", content: string }> = [],
): Promise<DocsChatResponse> {
  const response = await fetch(`${siteUrls.api}/v1/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message, history }),
  })
  const json = await response.json() as DocsChatResponse & { error?: string, message?: string }
  if (!response.ok || !json.ok) {
    throw new Error(json.message || json.error || `Chat failed (${response.status})`)
  }
  return json
}

/**
 * Streams an Ask Limetry answer over SSE (`POST /v1/chat/stream`).
 *
 * Falls back to non-streaming `askDocs` when the stream endpoint is unavailable.
 *
 * @param message - User question.
 * @param history - Prior turns.
 * @param handlers - Stream callbacks.
 * @returns Final assembled response.
 */
export async function askDocsStream(
  message: string,
  history: Array<{ role: "user" | "assistant", content: string }> = [],
  handlers: StreamHandlers = {},
): Promise<DocsChatResponse> {
  const response = await fetch(`${siteUrls.api}/v1/chat/stream`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "text/event-stream",
    },
    body: JSON.stringify({ message, history }),
  })

  if (!response.ok || !response.body) {
    return askDocs(message, history)
  }

  const contentType = response.headers.get("content-type") || ""
  if (!contentType.includes("text/event-stream")) {
    const json = await response.json() as DocsChatResponse & { error?: string, message?: string }
    if (!json.ok) {
      throw new Error(json.message || json.error || `Chat failed (${response.status})`)
    }
    handlers.onMeta?.({
      sources: json.sources,
      backend: json.backend,
      model: json.model,
    })
    handlers.onDelta?.(json.answer)
    handlers.onDone?.()
    return json
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  let answer = ""
  let sources: DocsChatSource[] = []
  let backend = "memory"
  let model: string | undefined

  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }
    buffer += decoder.decode(value, { stream: true })
    const parts = buffer.split("\n\n")
    buffer = parts.pop() ?? ""
    for (const part of parts) {
      const line = part
        .split("\n")
        .map((row) => row.trim())
        .find((row) => row.startsWith("data:"))
      if (!line) {
        continue
      }
      const raw = line.slice("data:".length).trim()
      if (!raw) {
        continue
      }
      let event: {
        type?: string
        text?: string
        sources?: DocsChatSource[]
        backend?: string
        model?: string
        message?: string
      }
      try {
        event = JSON.parse(raw) as typeof event
      } catch {
        continue
      }
      if (event.type === "meta") {
        sources = event.sources ?? []
        backend = event.backend ?? backend
        model = event.model
        handlers.onMeta?.({ sources, backend, model })
      } else if (event.type === "delta" && event.text) {
        answer += event.text
        handlers.onDelta?.(event.text)
      } else if (event.type === "error") {
        throw new Error(event.message || "Chat stream failed")
      } else if (event.type === "done") {
        handlers.onDone?.()
      }
    }
  }

  handlers.onDone?.()
  return {
    ok: true,
    answer,
    sources,
    backend,
    model,
  }
}
