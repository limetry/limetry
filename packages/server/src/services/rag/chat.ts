/**
 * Docs RAG chat orchestration (memory / pgvector / Bedrock Knowledge Bases).
 */

import type { ServerEnv } from "../../env.js"
import { loadCorpus, retrieveFromChunks } from "./corpus.js"
import { extractiveAnswer, formatContext, RAG_SYSTEM_PROMPT } from "./prompt.js"
import type {
  RagBackendName,
  RagChatRequest,
  RagChatResponse,
  RagSource,
} from "./types.js"

/**
 * Resolves the active RAG backend from env.
 *
 * @param env - Server env.
 * @returns Backend name.
 */
export function resolveRagBackend(env: ServerEnv): RagBackendName {
  const value = env.LIMETRY_RAG_BACKEND
  if (value === "pgvector" || value === "bedrock-kb" || value === "memory") {
    return value
  }
  return "memory"
}

/**
 * Retrieves sources for a question using the configured backend.
 *
 * @param env - Server env.
 * @param message - User question.
 * @returns Ranked sources.
 */
export async function retrieveSources(
  env: ServerEnv,
  message: string,
): Promise<RagSource[]> {
  const backend = resolveRagBackend(env)
  if (backend === "bedrock-kb") {
    const { retrieveBedrockKnowledgeBase } = await import("./bedrock-kb.js")
    return retrieveBedrockKnowledgeBase(env, message)
  }
  if (backend === "pgvector") {
    const { retrievePgvector } = await import("./pgvector-store.js")
    try {
      return await retrievePgvector(env, message)
    } catch {
      // Fall through to memory corpus when Postgres/pgvector is unavailable.
    }
  }
  const chunks = loadCorpus(env.LIMETRY_RAG_CORPUS_PATH)
  return retrieveFromChunks(message, chunks)
}

/**
 * Generates an answer with AI SDK when a provider key is available.
 *
 * @param env - Server env.
 * @param message - User question.
 * @param sources - Retrieved evidence.
 * @param history - Optional prior turns.
 * @returns Model text + model id, or null when no provider is configured.
 */
async function generateWithAiSdk(
  env: ServerEnv,
  message: string,
  sources: RagSource[],
  history: RagChatRequest["history"] = [],
): Promise<{ text: string, model: string } | null> {
  const context = formatContext(sources)
  const messages = [
    ...(history ?? []).map((turn) => ({
      role: turn.role,
      content: turn.content,
    })),
    {
      role: "user" as const,
      content: `Question:\n${message}\n\nSources:\n${context}`,
    },
  ]

  try {
    const { generateText } = await import("ai")
    // Prefer explicit API keys so ambient AWS profiles do not block local OSS.
    if (env.ANTHROPIC_API_KEY) {
      const { createAnthropic } = await import("@ai-sdk/anthropic")
      const anthropic = createAnthropic({ apiKey: env.ANTHROPIC_API_KEY })
      const modelId = env.LIMETRY_RAG_CHAT_MODEL || "claude-sonnet-4-20250514"
      const result = await generateText({
        model: anthropic(modelId),
        system: RAG_SYSTEM_PROMPT,
        messages,
      })
      return { text: result.text, model: modelId }
    }
    if (env.OPENAI_API_KEY) {
      const { createOpenAI } = await import("@ai-sdk/openai")
      const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY })
      const modelId = env.LIMETRY_RAG_CHAT_MODEL || "gpt-4o-mini"
      const result = await generateText({
        model: openai(modelId),
        system: RAG_SYSTEM_PROMPT,
        messages,
      })
      return { text: result.text, model: modelId }
    }
    const useBedrock = Boolean(
      env.LIMETRY_BEDROCK_MODEL_ID
      || env.LIMETRY_RAG_BACKEND === "bedrock-kb"
      || env.AWS_ACCESS_KEY_ID,
    )
    if (useBedrock) {
      const { createAmazonBedrock } = await import("@ai-sdk/amazon-bedrock")
      const bedrock = createAmazonBedrock({
        region: env.LIMETRY_BEDROCK_REGION || process.env.AWS_REGION || "us-east-1",
      })
      const modelId = env.LIMETRY_BEDROCK_MODEL_ID || "anthropic.claude-3-5-sonnet-20241022-v2:0"
      const result = await generateText({
        model: bedrock(modelId),
        system: RAG_SYSTEM_PROMPT,
        messages,
      })
      return { text: result.text, model: modelId }
    }
  } catch (error) {
    console.warn("[rag] AI SDK generation failed; using extractive answer", error)
  }
  return null
}

/**
 * Runs retrieve + generate for a docs chat turn.
 *
 * @param env - Server env.
 * @param request - Chat payload.
 * @returns Answer with citations.
 */
export async function runRagChat(
  env: ServerEnv,
  request: RagChatRequest,
): Promise<RagChatResponse> {
  const message = request.message.trim()
  if (!message) {
    throw new Error("message is required")
  }

  const backend = resolveRagBackend(env)
  let sources: RagSource[] = []

  if (backend === "bedrock-kb" && env.LIMETRY_BEDROCK_KB_ID) {
    try {
      const { retrieveAndGenerateBedrock } = await import("./bedrock-kb.js")
      const generated = await retrieveAndGenerateBedrock(env, message)
      if (generated) {
        return generated
      }
    } catch (error) {
      console.warn("[rag] Bedrock RetrieveAndGenerate failed; falling back", error)
    }
  }

  sources = await retrieveSources(env, message)
  const generated = await generateWithAiSdk(env, message, sources, request.history)
  if (generated) {
    return {
      answer: generated.text,
      sources,
      backend,
      model: generated.model,
    }
  }

  return {
    answer: extractiveAnswer(message, sources),
    sources,
    backend,
  }
}
