/**
 * Ask Limetry product assistant orchestration (memory / pgvector / Bedrock).
 *
 * Anthropic/OpenAI use the AI SDK when API keys are set. Bedrock uses AWS SDK
 * Converse / ConverseStream only (never `@ai-sdk/amazon-bedrock`).
 */

import {
  generateWithBedrockConverse,
  streamWithBedrockConverse,
} from "./bedrock-converse.js"
import { enrichSources } from "./citations.js"
import { loadCorpus, retrieveFromChunks } from "./corpus.js"
import type { AssistantEnv } from "./env.js"
import { hasAwsCredentials } from "./env.js"
import { ASSISTANT_SYSTEM_PROMPT, extractiveAnswer, formatContext } from "./prompt.js"
import type {
  AssistantBackendName,
  AssistantChatRequest,
  AssistantChatResponse,
  AssistantSource,
} from "./types.js"

/**
 * Resolves the active assistant retrieval backend from env.
 *
 * @param env - Assistant env.
 * @returns Backend name.
 */
export function resolveAssistantBackend(env: AssistantEnv): AssistantBackendName {
  const value = env.LIMETRY_ASSISTANT_BACKEND
  if (value === "pgvector" || value === "bedrock-kb" || value === "memory") {
    return value
  }
  return "memory"
}

/**
 * Returns whether an LLM provider is configured for synthesis.
 *
 * @param env - Assistant env.
 * @returns True when Anthropic, OpenAI, or usable Bedrock credentials exist.
 */
export function hasLlmProvider(env: AssistantEnv): boolean {
  if (env.ANTHROPIC_API_KEY || env.OPENAI_API_KEY) {
    return true
  }
  // Bedrock Converse uses a package default model when LIMETRY_BEDROCK_MODEL_ID is unset.
  return hasAwsCredentials(env)
}

/**
 * Retrieves sources for a question using the configured backend.
 *
 * @param env - Assistant env.
 * @param message - User question.
 * @returns Ranked sources.
 */
export async function retrieveSources(
  env: AssistantEnv,
  message: string,
): Promise<AssistantSource[]> {
  const backend = resolveAssistantBackend(env)
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
  const chunks = loadCorpus(env.LIMETRY_ASSISTANT_CORPUS_PATH)
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
  sources: AssistantSource[],
  history: AssistantChatRequest["history"] = [],
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
 * Resolves an AI SDK model for Anthropic or OpenAI API keys only.
 *
 * @param env - Assistant env.
 * @returns Model handle or null.
 */
async function resolvePortableAiSdkModel(env: AssistantEnv): Promise<AiSdkModel | null> {
  if (env.ANTHROPIC_API_KEY) {
    const { createAnthropic } = await import("@ai-sdk/anthropic")
    const anthropic = createAnthropic({ apiKey: env.ANTHROPIC_API_KEY })
    const modelId = env.LIMETRY_ASSISTANT_MODEL || "claude-sonnet-4-20250514"
    return { model: anthropic(modelId), modelId }
  }
  if (env.OPENAI_API_KEY) {
    const { createOpenAI } = await import("@ai-sdk/openai")
    const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY })
    const modelId = env.LIMETRY_ASSISTANT_MODEL || "gpt-4o-mini"
    return { model: openai(modelId), modelId }
  }
  return null
}

/**
 * Generates an answer with AI SDK (Anthropic/OpenAI) when keys are set.
 *
 * @param env - Assistant env.
 * @param message - User question.
 * @param sources - Retrieved evidence.
 * @param history - Optional prior turns.
 * @returns Model text + model id, or null.
 */
async function generateWithPortableAiSdk(
  env: AssistantEnv,
  message: string,
  sources: AssistantSource[],
  history: AssistantChatRequest["history"] = [],
): Promise<{ text: string, model: string } | null> {
  const resolved = await resolvePortableAiSdkModel(env)
  if (!resolved) {
    return null
  }
  try {
    const { generateText } = await import("ai")
    const result = await generateText({
      model: resolved.model as never,
      system: ASSISTANT_SYSTEM_PROMPT,
      messages: buildMessages(message, sources, history),
    })
    return { text: result.text, model: resolved.modelId }
  } catch (error) {
    console.warn("[assistant] AI SDK generation failed; falling back", error)
    return null
  }
}

/**
 * Streams an answer with AI SDK (Anthropic/OpenAI) when keys are set.
 *
 * @param env - Assistant env.
 * @param message - User question.
 * @param sources - Retrieved evidence.
 * @param history - Optional prior turns.
 * @returns Async text stream + model id, or null.
 */
async function streamWithPortableAiSdk(
  env: AssistantEnv,
  message: string,
  sources: AssistantSource[],
  history: AssistantChatRequest["history"] = [],
): Promise<{ textStream: AsyncIterable<string>, model: string } | null> {
  const resolved = await resolvePortableAiSdkModel(env)
  if (!resolved) {
    return null
  }
  try {
    const { streamText } = await import("ai")
    const result = streamText({
      model: resolved.model as never,
      system: ASSISTANT_SYSTEM_PROMPT,
      messages: buildMessages(message, sources, history),
    })
    return { textStream: result.textStream, model: resolved.modelId }
  } catch (error) {
    console.warn("[assistant] AI SDK streaming failed; falling back", error)
    return null
  }
}

/**
 * Runs retrieve + generate for an Ask Limetry chat turn.
 *
 * @param env - Assistant env.
 * @param request - Chat payload.
 * @returns Answer with citations.
 */
export async function runAssistantChat(
  env: AssistantEnv,
  request: AssistantChatRequest,
): Promise<AssistantChatResponse> {
  const message = request.message.trim()
  if (!message) {
    throw new Error("message is required")
  }

  const backend = resolveAssistantBackend(env)

  if (backend === "bedrock-kb" && env.LIMETRY_BEDROCK_KB_ID && hasAwsCredentials(env)) {
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
      console.warn("[assistant] Bedrock RetrieveAndGenerate failed; falling back", error)
    }
  }

  const sources = await retrieveSources(env, message)
  const portable = await generateWithPortableAiSdk(env, message, sources, request.history)
  if (portable) {
    return {
      answer: portable.text,
      sources,
      backend,
      model: portable.model,
    }
  }

  const bedrock = await generateWithBedrockConverse(env, message, sources, request.history)
  if (bedrock) {
    return {
      answer: bedrock.text,
      sources,
      backend,
      model: bedrock.model,
    }
  }

  if (!hasLlmProvider(env)) {
    console.warn(
      "[assistant] No LLM provider configured (ANTHROPIC_API_KEY, OPENAI_API_KEY, or Bedrock with AWS credentials). Returning conversational fallback.",
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
 * @param env - Assistant env.
 * @param request - Chat payload.
 * @returns Sources, backend, and optional text stream.
 */
export async function prepareAssistantChatStream(
  env: AssistantEnv,
  request: AssistantChatRequest,
): Promise<{
  sources: AssistantSource[]
  backend: AssistantBackendName
  model?: string
  textStream: AsyncIterable<string> | null
  fallbackAnswer: string
}> {
  const message = request.message.trim()
  if (!message) {
    throw new Error("message is required")
  }
  const backend = resolveAssistantBackend(env)
  const sources = await retrieveSources(env, message)

  const portable = await streamWithPortableAiSdk(env, message, sources, request.history)
  if (portable) {
    return {
      sources,
      backend,
      model: portable.model,
      textStream: portable.textStream,
      fallbackAnswer: extractiveAnswer(message, sources),
    }
  }

  const bedrock = await streamWithBedrockConverse(env, message, sources, request.history)
  if (bedrock) {
    return {
      sources,
      backend,
      model: bedrock.model,
      textStream: bedrock.textStream,
      fallbackAnswer: extractiveAnswer(message, sources),
    }
  }

  return {
    sources,
    backend,
    textStream: null,
    fallbackAnswer: extractiveAnswer(message, sources),
  }
}
