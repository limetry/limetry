/**
 * Shared types for Limetry product assistant (memory / pgvector / Bedrock KB).
 */

/** Product stack a corpus source belongs to. */
export type AssistantProduct = "oss" | "cloud"

/** One retrieved evidence span with citation metadata. */
export type AssistantSource = {
  id: string
  title: string
  sourcePath: string
  section?: string
  snippet: string
  score: number
  product?: AssistantProduct
  href?: string
}

/** Chunk stored in the corpus index. */
export type AssistantChunk = {
  id: string
  title: string
  sourcePath: string
  section?: string
  text: string
  embedding?: number[]
  product?: AssistantProduct
  priority?: number
}

/** On-disk corpus file shape produced by the ingest script. */
export type AssistantCorpusFile = {
  version: 1
  generatedAt: string
  chunks: AssistantChunk[]
}

/** Chat request accepted by `POST /api/assistant`. */
export type AssistantChatRequest = {
  message: string
  history?: Array<{ role: "user" | "assistant", content: string }>
}

/** Non-streaming chat response with citations. */
export type AssistantChatResponse = {
  answer: string
  sources: AssistantSource[]
  backend: string
  model?: string
}

/** Supported assistant retrieval backends. */
export type AssistantBackendName = "memory" | "pgvector" | "bedrock-kb"
