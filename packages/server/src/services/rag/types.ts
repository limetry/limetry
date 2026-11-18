/**
 * Shared types for Limetry docs RAG (memory / pgvector / Bedrock KB).
 */

/** Product stack a corpus source belongs to. */
export type RagProduct = "oss" | "cloud"

/** One retrieved evidence span with citation metadata. */
export type RagSource = {
  id: string
  title: string
  sourcePath: string
  section?: string
  snippet: string
  score: number
  product?: RagProduct
  href?: string
}

/** Chunk stored in the corpus index. */
export type RagChunk = {
  id: string
  title: string
  sourcePath: string
  section?: string
  text: string
  embedding?: number[]
  product?: RagProduct
  priority?: number
}

/** On-disk corpus file shape produced by the ingest script. */
export type RagCorpusFile = {
  version: 1
  generatedAt: string
  chunks: RagChunk[]
}

/** Chat request accepted by `POST /v1/chat`. */
export type RagChatRequest = {
  message: string
  history?: Array<{ role: "user" | "assistant", content: string }>
}

/** Non-streaming chat response with citations. */
export type RagChatResponse = {
  answer: string
  sources: RagSource[]
  backend: string
  model?: string
}

/** Supported RAG backends. */
export type RagBackendName = "memory" | "pgvector" | "bedrock-kb"
