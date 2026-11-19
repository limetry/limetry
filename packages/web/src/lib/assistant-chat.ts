/**
 * Client helpers for the Limetry product assistant chat UI.
 */

/** One citation returned by `POST /api/assistant`. */
export type AssistantChatSource = {
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
export type AssistantChatClientResponse = {
  ok: true
  answer: string
  sources: AssistantChatSource[]
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
export function normalizeAssistantSourcePath(sourcePath: string): string {
  let normalized = sourcePath.replace(/\\/g, "/").trim()
  const s3Match = normalized.match(/^s3:\/\/[^/]+\/(.+)$/i)
  if (s3Match?.[1]) {
    normalized = s3Match[1]
  }
  normalized = normalized.replace(/^\/+/, "")
  const plainPrefix = "docs/assistant/corpus/plain/"
  if (normalized.startsWith(plainPrefix)) {
    const leaf = normalized.slice(plainPrefix.length)
    normalized = leaf
      .replace(/__[a-f0-9]{8,}(?:\.txt)?$/i, "")
      .replace(/\.txt$/i, "")
      .replace(/__/g, "/")
  }
  // Keep limetry-enterprise/ so Cloud sources are not mapped to OSS root guides.
  return normalized
}

/**
 * Maps a corpus source path to an in-site docs href when possible.
 *
 * @param sourcePath - Repo-relative path from the assistant corpus.
 * @returns Site-relative docs URL or null.
 */
export function assistantHrefForSource(sourcePath: string): string | null {
  const normalized = normalizeAssistantSourcePath(sourcePath)
  if (
    normalized.startsWith("limetry-enterprise/")
    || normalized.startsWith("enterprise/")
  ) {
    return null
  }
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
/**
 * True when a retrieval title is corpus/Bedrock artifact metadata.
 *
 * @param title - Candidate title.
 * @returns Whether to ignore the title for citation labels.
 */
function isArtifactCitationTitle(title: string): boolean {
  if (/^chunk-\d+$/i.test(title)) {
    return true
  }
  if (/__[a-f0-9]{8,}/i.test(title)) {
    return true
  }
  if (/\.txt$/i.test(title)) {
    return true
  }
  return false
}

export function assistantCitationLabel(source: Pick<AssistantChatSource, "title" | "sourcePath" | "section">): string {
  const title = source.title?.trim()
  if (title && !isArtifactCitationTitle(title)) {
    return title
  }
  const path = normalizeAssistantSourcePath(source.sourcePath)
  const base = path.split("/").pop() ?? path
  return base.replace(/\.(mdx?|ya?ml|json|txt)$/i, "")
}

/**
 * Resolves the best href for a source (API href wins when present).
 *
 * @param source - Chat source.
 * @returns Href or null.
 */
export function resolveSourceHref(source: AssistantChatSource): string | null {
  if (source.href) {
    return source.href
  }
  return assistantHrefForSource(source.sourcePath)
}

type StreamHandlers = {
  onMeta?: (meta: { sources: AssistantChatSource[], backend: string, model?: string }) => void
  onDelta?: (text: string) => void
  onDone?: () => void
  onError?: (message: string) => void
}

/**
 * Same-origin Ask Limetry endpoints (CloudFront → Lambda in prod; Next rewrite locally).
 */
const CHAT_PATH = "/api/assistant"
const CHAT_STREAM_PATH = "/api/assistant/stream"

/**
 * Parses a chat JSON body, or throws a readable error for HTML/proxy failures.
 *
 * @param response - Fetch response.
 * @returns Parsed payload.
 */
async function readChatJson(
  response: Response,
): Promise<AssistantChatClientResponse & { error?: string, message?: string }> {
  const contentType = response.headers.get("content-type") || ""
  const raw = await response.text()
  if (!contentType.includes("application/json")) {
    throw new Error(
      response.ok
        ? "Ask Limetry returned a non-JSON response. Is `yarn dev:assistant` running on :3815?"
        : `Ask Limetry unavailable (${response.status})`,
    )
  }
  try {
    return JSON.parse(raw) as AssistantChatClientResponse & { error?: string, message?: string }
  } catch {
    throw new Error(
      `Ask Limetry returned invalid JSON (${response.status}). Is \`yarn dev:assistant\` running on :3815?`,
    )
  }
}

/**
 * Calls Ask Limetry (non-streaming).
 *
 * @param message - User question.
 * @param history - Prior turns.
 * @returns Parsed chat response.
 */
export async function askAssistant(
  message: string,
  history: Array<{ role: "user" | "assistant", content: string }> = [],
): Promise<AssistantChatClientResponse> {
  const response = await fetch(CHAT_PATH, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message, history }),
  })
  const json = await readChatJson(response)
  if (!response.ok || !json.ok) {
    throw new Error(json.message || json.error || `Chat failed (${response.status})`)
  }
  return json
}

/**
 * Streams an Ask Limetry answer over SSE (`POST /api/assistant/stream`).
 *
 * Falls back to non-streaming `askAssistant` when the stream endpoint is unavailable.
 * Stream `error` events clear Thinking… via `onError` / thrown message after fallback delta.
 *
 * @param message - User question.
 * @param history - Prior turns.
 * @param handlers - Stream callbacks.
 * @returns Final assembled response.
 */
export async function askAssistantStream(
  message: string,
  history: Array<{ role: "user" | "assistant", content: string }> = [],
  handlers: StreamHandlers = {},
): Promise<AssistantChatClientResponse> {
  const response = await fetch(CHAT_STREAM_PATH, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "text/event-stream",
    },
    body: JSON.stringify({ message, history }),
  })

  if (!response.ok || !response.body) {
    try {
      const fallback = await askAssistant(message, history)
      handlers.onMeta?.({
        sources: fallback.sources,
        backend: fallback.backend,
        model: fallback.model,
      })
      handlers.onDelta?.(fallback.answer)
      handlers.onDone?.()
      return fallback
    } catch (error) {
      const messageText = error instanceof Error
        ? error.message
        : `Ask Limetry unavailable (${response.status})`
      throw new Error(messageText)
    }
  }

  const contentType = response.headers.get("content-type") || ""
  if (!contentType.includes("text/event-stream")) {
    const json = await readChatJson(response)
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
  let sources: AssistantChatSource[] = []
  let backend = "memory"
  let model: string | undefined
  let sawDone = false

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
        sources?: AssistantChatSource[]
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
        const message = event.message || "Chat stream failed"
        handlers.onError?.(message)
        // Prefer conversational fallback deltas that follow; only fail hard
        // when the stream ends with no answer text.
        if (!answer) {
          // Keep reading for a possible fallback delta + done.
        }
      } else if (event.type === "done") {
        if (!sawDone) {
          sawDone = true
          handlers.onDone?.()
        }
      }
    }
  }

  // Server streams guarantee a terminal `done`; only call onDone at EOF if
  // the stream ended without one (truncated / proxy cut).
  if (!sawDone) {
    handlers.onDone?.()
  }
  if (!answer) {
    throw new Error("Chat stream failed")
  }
  return {
    ok: true,
    answer,
    sources,
    backend,
    model,
  }
}
