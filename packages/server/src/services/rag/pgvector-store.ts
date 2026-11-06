/**
 * Optional Postgres pgvector retrieval for portable multi-cloud RAG.
 *
 * Falls back gracefully when the extension or table is missing.
 */

import { Pool } from "pg"

import type { ServerEnv } from "../../env.js"
import {
  bedrockTitanEmbedding,
  localHashEmbedding,
  openAiEmbedding,
} from "./embeddings.js"
import type { RagChunk, RagSource } from "./types.js"

/**
 * Embeds a query with the best available provider.
 *
 * @param env - Server env.
 * @param text - Query text.
 * @returns Embedding vector.
 */
async function embedQuery(env: ServerEnv, text: string): Promise<number[]> {
  if (env.OPENAI_API_KEY) {
    return openAiEmbedding(text, env.OPENAI_API_KEY)
  }
  if (env.LIMETRY_BEDROCK_EMBED_MODEL_ID) {
    const region = env.LIMETRY_BEDROCK_REGION || process.env.AWS_REGION || "us-east-1"
    return bedrockTitanEmbedding(text, env.LIMETRY_BEDROCK_EMBED_MODEL_ID, region)
  }
  return localHashEmbedding(text)
}

/**
 * Ensures pgvector extension + rag_chunks table exist.
 *
 * @param pool - Postgres pool.
 */
export async function ensureRagSchema(pool: Pool): Promise<void> {
  await pool.query("CREATE EXTENSION IF NOT EXISTS vector")
  await pool.query(`
    CREATE TABLE IF NOT EXISTS limetry_rag_chunks (
      id text PRIMARY KEY,
      title text NOT NULL,
      source_path text NOT NULL,
      section text,
      body text NOT NULL,
      embedding vector(256)
    )
  `)
}

/**
 * Upserts corpus chunks into Postgres (local 256-d embeddings by default).
 *
 * @param pool - Postgres pool.
 * @param chunks - Corpus chunks.
 */
export async function upsertRagChunks(pool: Pool, chunks: RagChunk[]): Promise<void> {
  await ensureRagSchema(pool)
  for (const chunk of chunks) {
    const embedding = chunk.embedding ?? localHashEmbedding(chunk.text)
    const literal = `[${embedding.join(",")}]`
    await pool.query(
      `INSERT INTO limetry_rag_chunks (id, title, source_path, section, body, embedding)
       VALUES ($1, $2, $3, $4, $5, $6::vector)
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title,
         source_path = EXCLUDED.source_path,
         section = EXCLUDED.section,
         body = EXCLUDED.body,
         embedding = EXCLUDED.embedding`,
      [chunk.id, chunk.title, chunk.sourcePath, chunk.section ?? null, chunk.text, literal],
    )
  }
}

/**
 * Similarity search via pgvector (`<=>` cosine distance).
 *
 * @param env - Server env with DATABASE_URL.
 * @param query - User question.
 * @returns Ranked sources.
 */
export async function retrievePgvector(
  env: ServerEnv,
  query: string,
): Promise<RagSource[]> {
  const pool = new Pool({ connectionString: env.DATABASE_URL })
  try {
    await ensureRagSchema(pool)
    const embedding = await embedQuery(env, query)
    // Local hash embeddings are 256-d; OpenAI/Bedrock dims differ — when dims
    // mismatch, fall back to a sequential scan using stored vectors only if
    // dimensions match; otherwise return empty and let caller use memory.
    const dimCheck = await pool.query<{ dim: number }>(
      `SELECT COALESCE(vector_dims(embedding), 0)::int AS dim
       FROM limetry_rag_chunks
       LIMIT 1`,
    )
    const storedDim = dimCheck.rows[0]?.dim ?? 0
    if (storedDim > 0 && storedDim !== embedding.length) {
      return []
    }
    const literal = `[${embedding.join(",")}]`
    const result = await pool.query<{
      id: string
      title: string
      source_path: string
      section: string | null
      body: string
      score: number
    }>(
      `SELECT id, title, source_path, section, body,
              1 - (embedding <=> $1::vector) AS score
       FROM limetry_rag_chunks
       ORDER BY embedding <=> $1::vector
       LIMIT 6`,
      [literal],
    )
    return result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      sourcePath: row.source_path,
      section: row.section ?? undefined,
      snippet: row.body.slice(0, 500),
      score: Number(row.score) || 0,
    }))
  } finally {
    await pool.end()
  }
}
