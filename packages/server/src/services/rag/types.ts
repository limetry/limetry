/**
 * Shared types for Limetry docs RAG (memory / pgvector / Bedrock KB).
 */

/** One retrieved evidence span with citation metadata. */
export type RagSource = {
  id: string
  title: string
  sourcePath: string
  section?: string
  snippet: string
  score: number
}

/** Chunk stored in the corpus index. */
export type RagChunk = {
  id: string
  title: string
  sourcePath: string
  section?: string
  text: string
  embedding?: number[]
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
