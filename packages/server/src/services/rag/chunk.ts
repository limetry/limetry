/**
 * Text normalization and chunking for docs RAG ingest.
 */

/**
 * Strips common MDX/JSX noise so embeddings see prose.
 *
 * @param raw - File contents.
 * @returns Plain-ish text.
 */
export function stripMdx(raw: string): string {
  return raw
    .replace(/^---[\s\S]*?---\s*/m, "")
    .replace(/```[\s\S]*?```/g, (block) => block.replace(/```\w*/g, "").trim())
    .replace(/import\s+.+from\s+["'].+["'];?/g, "")
    .replace(/export\s+(const|let|function|default)[\s\S]*?(?=\n#{1,6}\s|\n\n|$)/g, "")
    .replace(/<\/?[A-Za-z][^>]*>/g, " ")
    .replace(/\{[^}]+\}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

/**
 * Splits text into overlapping character windows.
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
  const chunks: string[] = []
  let start = 0
  while (start < cleaned.length) {
    const end = Math.min(cleaned.length, start + chunkSize)
    const slice = cleaned.slice(start, end).trim()
    if (slice.length > 0) {
      chunks.push(slice)
    }
    if (end >= cleaned.length) {
      break
    }
    start = Math.max(0, end - overlap)
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
    return heading[1].trim()
  }
  const base = sourcePath.split("/").pop() ?? sourcePath
  return base.replace(/\.(mdx?|ya?ml|json)$/i, "")
}
