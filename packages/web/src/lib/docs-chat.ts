/**
 * Client helpers for the Limetry docs RAG chat UI.
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
}

/** Successful chat API payload. */
export type DocsChatResponse = {
  ok: true
  answer: string
  sources: DocsChatSource[]
  backend: string
  model?: string
}

/**
 * Maps a corpus source path to an in-site docs href when possible.
 *
 * @param sourcePath - Repo-relative path from the RAG corpus.
 * @returns Site-relative docs URL or null.
 */
export function docsHrefForSource(sourcePath: string): string | null {
  const normalized = sourcePath.replace(/\\/g, "/")
  const docsPrefix = "packages/web/content/docs/"
  if (normalized.startsWith(docsPrefix)) {
    const rest = normalized.slice(docsPrefix.length).replace(/\.mdx?$/i, "")
    if (rest === "index" || rest.endsWith("/index")) {
      return "/docs"
    }
    return `/docs/${rest}`
  }
  if (normalized === "README.md") {
    return "/docs/introduction"
  }
  if (normalized === "INSTALL.md") {
    return "/docs/server/self-hosting"
  }
  if (normalized === "USAGE.md") {
    return "/docs/quick-start"
  }
  if (normalized === "SECURITY.md") {
    return "/docs/server/data-minimization"
  }
  return null
}

/**
 * Calls the Limetry server docs chat endpoint.
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
