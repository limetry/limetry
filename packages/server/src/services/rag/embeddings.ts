/**
 * Embedding helpers for portable RAG (local hash, OpenAI, Bedrock Titan).
 */

import { createHash } from "node:crypto"

/** Fixed dimensionality for local hash embeddings. */
export const LOCAL_EMBED_DIM = 256

/**
 * Deterministic bag-of-tokens embedding for offline / test retrieval.
 *
 * Not a substitute for Titan/OpenAI in production quality, but enables
 * ingest + chat smoke tests without cloud credentials.
 *
 * @param text - Input text.
 * @returns Unit-ish float vector of length {@link LOCAL_EMBED_DIM}.
 */
export function localHashEmbedding(text: string): number[] {
  const vector = new Array<number>(LOCAL_EMBED_DIM).fill(0)
  const tokens = text.toLowerCase().split(/[^a-z0-9_./+-]+/).filter(Boolean)
  for (const token of tokens) {
    const digest = createHash("sha256").update(token).digest()
    const index = digest.readUInt16BE(0) % LOCAL_EMBED_DIM
    const sign = digest[2]! & 1 ? 1 : -1
    vector[index]! += sign
  }
  return l2Normalize(vector)
}

/**
 * Cosine similarity between two equal-length vectors.
 *
 * @param a - Left vector.
 * @param b - Right vector.
 * @returns Similarity in [-1, 1], or 0 when norms are zero.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length)
  let dot = 0
  let na = 0
  let nb = 0
  for (let i = 0; i < n; i += 1) {
    const x = a[i] ?? 0
    const y = b[i] ?? 0
    dot += x * y
    na += x * x
    nb += y * y
  }
  if (na === 0 || nb === 0) {
    return 0
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}

/**
 * L2-normalizes a vector in place and returns it.
 *
 * @param vector - Mutable vector.
 * @returns Same array normalized (or unchanged if zero).
 */
export function l2Normalize(vector: number[]): number[] {
  let sum = 0
  for (const value of vector) {
    sum += value * value
  }
  if (sum === 0) {
    return vector
  }
  const norm = Math.sqrt(sum)
  for (let i = 0; i < vector.length; i += 1) {
    vector[i] = (vector[i] ?? 0) / norm
  }
  return vector
}

/**
 * Embeds text with OpenAI embeddings API when `OPENAI_API_KEY` is set.
 *
 * @param text - Input text.
 * @param apiKey - OpenAI API key.
 * @param model - Embedding model id.
 * @returns Embedding vector.
 */
export async function openAiEmbedding(
  text: string,
  apiKey: string,
  model = "text-embedding-3-small",
): Promise<number[]> {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ model, input: text }),
  })
  if (!response.ok) {
    const body = await response.text()
    throw new Error(`OpenAI embeddings failed (${response.status}): ${body}`)
  }
  const json = await response.json() as {
    data?: Array<{ embedding?: number[] }>
  }
  const embedding = json.data?.[0]?.embedding
  if (!embedding) {
    throw new Error("OpenAI embeddings response missing vector")
  }
  return embedding
}

/**
 * Embeds text with Bedrock Titan Embed via the Converse-adjacent invoke API.
 *
 * Uses dynamic import of `@aws-sdk/client-bedrock-runtime` so the server
 * builds without requiring the SDK until Bedrock mode is used.
 *
 * @param text - Input text.
 * @param modelId - Titan Embed model id.
 * @param region - AWS region.
 * @returns Embedding vector.
 */
export async function bedrockTitanEmbedding(
  text: string,
  modelId: string,
  region: string,
): Promise<number[]> {
  const { BedrockRuntimeClient, InvokeModelCommand } = await import(
    "@aws-sdk/client-bedrock-runtime"
  )
  const client = new BedrockRuntimeClient({ region })
  const result = await client.send(new InvokeModelCommand({
    modelId,
    contentType: "application/json",
    accept: "application/json",
    body: Buffer.from(JSON.stringify({
      inputText: text.slice(0, 8_000),
    })),
  }))
  const payload = JSON.parse(Buffer.from(result.body).toString("utf8")) as {
    embedding?: number[]
  }
  if (!payload.embedding) {
    throw new Error("Bedrock Titan Embed response missing embedding")
  }
  return payload.embedding
}
