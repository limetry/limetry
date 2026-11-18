/**
 * Text normalization and chunking for assistant corpus ingest.
 */

/**
 * Flattens markdown tables into space-separated prose.
 *
 * @param text - Document text.
 * @returns Text without table chrome.
 */
function flattenMarkdownTables(text: string): string {
  return text.replace(
    /(?:^\|.+\|[ \t]*\n)+/gm,
    (block) => {
      const cells = block
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.startsWith("|") && !/^\|[\s|:-]+$/.test(line))
        .map((line) => line
          .replace(/^\||\|$/g, "")
          .split("|")
          .map((cell) => cell.trim())
          .filter(Boolean)
          .join(" — "))
      return `${cells.join(". ")}\n`
    },
  )
}

/**
 * Removes GitHub-style callout markers while keeping the note body.
 *
 * @param text - Document text.
 * @returns Text without `[!NOTE]` chrome.
 */
function flattenCallouts(text: string): string {
  return text
    .replace(/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/gim, "")
    .replace(/^>\s?/gm, "")
}

/**
 * Strips common MDX/JSX and markdown chrome so embeddings see prose.
 *
 * @param raw - File contents.
 * @returns Plain-ish text.
 */
export function stripMdx(raw: string): string {
  return flattenCallouts(
    flattenMarkdownTables(
      raw
        .replace(/^---[\s\S]*?---\s*/m, "")
        .replace(/```[\s\S]*?```/g, (block) => block.replace(/```\w*/g, "").trim())
        .replace(/import\s+.+from\s+["'].+["'];?/g, "")
        .replace(/export\s+(const|let|function|default)[\s\S]*?(?=\n#{1,6}\s|\n\n|$)/g, "")
        .replace(/<\/?[A-Za-z][^>]*>/g, " ")
        .replace(/\{[^}]+\}/g, " ")
        .replace(/\n{3,}/g, "\n\n"),
    ),
  ).trim()
}

/**
 * Normalizes any markdown/docs source for retrieval (MD or MDX).
 *
 * @param raw - File contents.
 * @returns Prose-oriented text.
 */
export function normalizeDocText(raw: string): string {
  return stripMdx(raw)
}

/**
 * Snaps an index forward/back to a word or newline boundary.
 *
 * @param text - Full text.
 * @param index - Candidate index.
 * @param direction - Search direction.
 * @returns Boundary index.
 */
function snapBoundary(
  text: string,
  index: number,
  direction: "start" | "end",
): number {
  if (index <= 0) {
    return 0
  }
  if (index >= text.length) {
    return text.length
  }
  if (/\s/.test(text[index] ?? "") || /\s/.test(text[index - 1] ?? "")) {
    return index
  }
  if (direction === "end") {
    const next = text.indexOf(" ", index)
    const nextNl = text.indexOf("\n", index)
    const candidates = [next, nextNl].filter((value) => value >= 0)
    if (candidates.length === 0) {
      return text.length
    }
    return Math.min(...candidates)
  }
  const prevSpace = text.lastIndexOf(" ", index)
  const prevNl = text.lastIndexOf("\n", index)
  const boundary = Math.max(prevSpace, prevNl)
  return boundary >= 0 ? boundary + 1 : 0
}

/**
 * Prefer splitting on markdown headings when present.
 *
 * @param text - Normalized document text.
 * @param chunkSize - Target characters per chunk.
 * @param overlap - Overlap between consecutive chunks.
 * @returns Chunk strings (non-empty).
 */
export function chunkText(
  text: string,
  chunkSize = 1_200,
  overlap = 200,
): string[] {
  const cleaned = text.replace(/\r\n/g, "\n").trim()
  if (cleaned.length === 0) {
    return []
  }
  if (cleaned.length <= chunkSize) {
    return [cleaned]
  }

  const headingSplits = cleaned.split(/(?=^#{1,3}\s)/m).map((part) => part.trim()).filter(Boolean)
  if (headingSplits.length > 1) {
    const merged: string[] = []
    let buffer = ""
    for (const part of headingSplits) {
      if (buffer.length === 0) {
        buffer = part
        continue
      }
      if (`${buffer}\n\n${part}`.length <= chunkSize) {
        buffer = `${buffer}\n\n${part}`
        continue
      }
      merged.push(...windowChunks(buffer, chunkSize, overlap))
      buffer = part
    }
    if (buffer) {
      merged.push(...windowChunks(buffer, chunkSize, overlap))
    }
    return merged.filter((chunk) => chunk.length > 0)
  }

  return windowChunks(cleaned, chunkSize, overlap)
}

/**
 * Sliding windows with word-boundary snaps.
 *
 * @param text - Text to split.
 * @param chunkSize - Target size.
 * @param overlap - Overlap size.
 * @returns Chunks.
 */
function windowChunks(text: string, chunkSize: number, overlap: number): string[] {
  if (text.length <= chunkSize) {
    return [text]
  }
  const chunks: string[] = []
  let start = 0
  while (start < text.length) {
    let end = Math.min(text.length, start + chunkSize)
    end = snapBoundary(text, end, "end")
    if (end <= start) {
      end = Math.min(text.length, start + chunkSize)
    }
    const slice = text.slice(start, end).trim()
    if (slice.length > 0) {
      chunks.push(slice)
    }
    if (end >= text.length) {
      break
    }
    const nextStart = Math.max(0, end - overlap)
    start = snapBoundary(text, nextStart, "start")
    if (start >= end) {
      start = end
    }
    if (start >= text.length) {
      break
    }
  }
  return chunks
}

/**
 * Extracts a human title from path + leading heading.
 *
 * @param sourcePath - Repo-relative path.
 * @param text - Document text.
 * @returns Title string.
 */
export function titleFromDoc(sourcePath: string, text: string): string {
  const heading = text.match(/^#\s+(.+)$/m)
  if (heading?.[1]) {
    return heading[1].trim().replace(/`/g, "")
  }
  const base = sourcePath.split("/").pop() ?? sourcePath
  return base.replace(/\.(mdx?|ya?ml|json)$/i, "")
}

/**
 * Priority weight for ranking: official docs beat package READMEs.
 *
 * @param sourcePath - Repo-relative path.
 * @returns Higher is better.
 */
export function sourcePriority(sourcePath: string): number {
  const normalized = sourcePath.replace(/\\/g, "/")
  if (normalized.startsWith("packages/web/content/docs/")) {
    return 3
  }
  if (
    normalized === "README.md"
    || normalized === "INSTALL.md"
    || normalized === "USAGE.md"
    || normalized === "SECURITY.md"
  ) {
    return 2
  }
  if (normalized.startsWith("docs/") && !normalized.startsWith("docs/api/")) {
    return 2
  }
  if (/\/README\.md$/i.test(normalized)) {
    return 1
  }
  return 0
}
