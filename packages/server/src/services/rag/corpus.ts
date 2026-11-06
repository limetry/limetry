/**
 * Load and search the on-disk Limetry docs RAG corpus.
 */

import { existsSync, readFileSync } from "node:fs"
import { homedir } from "node:os"
import { isAbsolute, join, resolve } from "node:path"

import { cosineSimilarity, localHashEmbedding } from "./embeddings.js"
import type { RagChunk, RagCorpusFile, RagSource } from "./types.js"

let cached: { path: string, chunks: RagChunk[] } | null = null

/**
 * Expands `~` and resolves a corpus path.
 *
 * Tries `process.cwd()`, then walks parents so `packages/server` and Lambda
 * working directories still find `docs/ai-rag/corpus/rag-corpus.json`.
 *
 * @param value - Configured path.
 * @returns Absolute filesystem path (best candidate; may not exist yet).
 */
export function resolveCorpusPath(value: string): string {
  const expanded = value.startsWith("~/")
    ? join(homedir(), value.slice(2))
    : value
  if (isAbsolute(expanded)) {
    return expanded
  }
  const fromCwd = resolve(process.cwd(), expanded)
  if (existsSync(fromCwd)) {
    return fromCwd
  }
  let dir = process.cwd()
  for (let i = 0; i < 8; i += 1) {
    const candidate = resolve(dir, expanded)
    if (existsSync(candidate)) {
      return candidate
    }
    const parent = resolve(dir, "..")
    if (parent === dir) {
      break
    }
    dir = parent
  }
  return fromCwd
}

/**
 * Loads corpus JSON, embedding any chunks that lack vectors with local hashes.
 *
 * @param corpusPath - Path to `rag-corpus.json`.
 * @returns Chunks ready for retrieval.
 */
export function loadCorpus(corpusPath: string): RagChunk[] {
  const absolute = resolveCorpusPath(corpusPath)
  if (cached?.path === absolute) {
    return cached.chunks
  }
  if (!existsSync(absolute)) {
    cached = { path: absolute, chunks: [] }
    return []
  }
  const parsed = JSON.parse(readFileSync(absolute, "utf8")) as RagCorpusFile
  const chunks = (parsed.chunks ?? []).map((chunk) => ({
    ...chunk,
    embedding: chunk.embedding ?? localHashEmbedding(chunk.text),
  }))
  cached = { path: absolute, chunks }
  return chunks
}

/**
 * Clears the in-process corpus cache (tests / re-ingest).
 */
export function clearCorpusCache(): void {
  cached = null
}

/**
 * Top-k similarity search over memory corpus chunks.
 *
 * @param query - User question.
 * @param chunks - Indexed chunks.
 * @param limit - Max results.
 * @returns Ranked sources.
 */
export function retrieveFromChunks(
  query: string,
  chunks: RagChunk[],
  limit = 6,
): RagSource[] {
  if (chunks.length === 0) {
    return []
  }
  const queryVector = localHashEmbedding(query)
  const ranked = chunks
    .map((chunk) => {
      const score = cosineSimilarity(queryVector, chunk.embedding ?? localHashEmbedding(chunk.text))
      return {
        id: chunk.id,
        title: chunk.title,
        sourcePath: chunk.sourcePath,
        section: chunk.section,
        snippet: chunk.text.slice(0, 500),
        score,
      } satisfies RagSource
    })
    .sort((a, b) => b.score - a.score)
  const positive = ranked.filter((row) => row.score > 0).slice(0, limit)
  if (positive.length > 0) {
    return positive
  }
  // Always surface something for extractive answers / smoke tests.
  return ranked.slice(0, Math.min(limit, 3))
}
