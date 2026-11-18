/**
 * Docs RAG chat orchestration (memory / pgvector / Bedrock Knowledge Bases).
 */

import type { ServerEnv } from "../../env.js"
import { enrichSources } from "./citations.js"
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
 * Returns whether an LLM provider is configured for synthesis.
 *
 * @param env - Server env.
 * @returns True when Anthropic, OpenAI, or Bedrock can be used.
 */
export function hasLlmProvider(env: ServerEnv): boolean {
  if (env.ANTHROPIC_API_KEY || env.OPENAI_API_KEY) {
    return true
  }
  return Boolean(
    env.LIMETRY_BEDROCK_MODEL_ID
    || env.LIMETRY_RAG_BACKEND === "bedrock-kb"
    || env.AWS_ACCESS_KEY_ID,
  )
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
    return enrichSources(await retrieveBedrockKnowledgeBase(env, message))
  }
  if (backend === "pgvector") {
    const { retrievePgvector } = await import("./pgvector-store.js")
    try {
      return enrichSources(await retrievePgvector(env, message))
    } catch {
      // Fall through to memory corpus when Postgres/pgvector is unavailable.
    }
  }
  const chunks = loadCorpus(env.LIMETRY_RAG_CORPUS_PATH)
  return retrieveFromChunks(message, chunks)
}

/**
 * Builds AI SDK messages for a grounded chat turn.
 *
 * @param message - User question.
 * @param sources - Retrieved evidence.
 * @param history - Optional prior turns.
 * @returns Chat messages.
 */
function buildMessages(
  message: string,
  sources: RagSource[],
  history: RagChatRequest["history"] = [],
): Array<{ role: "user" | "assistant", content: string }> {
  const context = formatContext(sources)
  return [
    ...(history ?? []).map((turn) => ({
      role: turn.role,
      content: turn.content,
    })),
    {
      role: "user" as const,
      content: `Question:\n${message}\n\nSources:\n${context}`,
    },
  ]
}

type AiSdkModel = {
  model: unknown
  modelId: string
}

/**
 * Resolves an AI SDK model from env keys.
 *
 * @param env - Server env.
 * @returns Model handle or null.
 */
async function resolveAiSdkModel(env: ServerEnv): Promise<AiSdkModel | null> {
  if (env.ANTHROPIC_API_KEY) {
    const { createAnthropic } = await import("@ai-sdk/anthropic")
    const anthropic = createAnthropic({ apiKey: env.ANTHROPIC_API_KEY })
    const modelId = env.LIMETRY_RAG_CHAT_MODEL || "claude-sonnet-4-20250514"
    return { model: anthropic(modelId), modelId }
  }
  if (env.OPENAI_API_KEY) {
    const { createOpenAI } = await import("@ai-sdk/openai")
    const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY })
    const modelId = env.LIMETRY_RAG_CHAT_MODEL || "gpt-4o-mini"
    return { model: openai(modelId), modelId }
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
    return { model: bedrock(modelId), modelId }
  }
  return null
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
  const resolved = await resolveAiSdkModel(env)
  if (!resolved) {
    return null
  }
  try {
    const { generateText } = await import("ai")
    const result = await generateText({
      model: resolved.model as never,
      system: RAG_SYSTEM_PROMPT,
      messages: buildMessages(message, sources, history),
    })
    return { text: result.text, model: resolved.modelId }
  } catch (error) {
    console.warn("[rag] AI SDK generation failed; using conversational fallback", error)
    return null
  }
}

/**
 * Streams an answer with AI SDK when a provider key is available.
 *
 * @param env - Server env.
 * @param message - User question.
 * @param sources - Retrieved evidence.
 * @param history - Optional prior turns.
 * @returns Async text stream + model id, or null.
 */
export async function streamWithAiSdk(
  env: ServerEnv,
  message: string,
  sources: RagSource[],
  history: RagChatRequest["history"] = [],
): Promise<{ textStream: AsyncIterable<string>, model: string } | null> {
  const resolved = await resolveAiSdkModel(env)
  if (!resolved) {
    return null
  }
  try {
    const { streamText } = await import("ai")
    const result = streamText({
      model: resolved.model as never,
      system: RAG_SYSTEM_PROMPT,
      messages: buildMessages(message, sources, history),
    })
    return { textStream: result.textStream, model: resolved.modelId }
  } catch (error) {
    console.warn("[rag] AI SDK streaming failed; falling back", error)
    return null
  }
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
        return {
          ...generated,
          sources: enrichSources(generated.sources),
        }
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

  if (!hasLlmProvider(env)) {
    console.warn(
      "[rag] No LLM provider configured (ANTHROPIC_API_KEY, OPENAI_API_KEY, or Bedrock). Returning conversational fallback without snippet dumps.",
    )
  }

  return {
    answer: extractiveAnswer(message, sources),
    sources,
    backend,
  }
}

/**
 * Prepares a streaming chat turn (retrieve first, then stream tokens).
 *
 * @param env - Server env.
 * @param request - Chat payload.
 * @returns Sources, backend, and optional text stream.
 */
export async function prepareRagChatStream(
  env: ServerEnv,
  request: RagChatRequest,
): Promise<{
  sources: RagSource[]
  backend: RagBackendName
  model?: string
  textStream: AsyncIterable<string> | null
  fallbackAnswer: string
}> {
  const message = request.message.trim()
  if (!message) {
    throw new Error("message is required")
  }
  const backend = resolveRagBackend(env)
  const sources = await retrieveSources(env, message)
  const streamed = await streamWithAiSdk(env, message, sources, request.history)
  if (streamed) {
    return {
      sources,
      backend,
      model: streamed.model,
      textStream: streamed.textStream,
      fallbackAnswer: "",
    }
  }
  return {
    sources,
    backend,
    textStream: null,
    fallbackAnswer: extractiveAnswer(message, sources),
  }
}
