/**
 * Bedrock chat via AWS SDK Converse / ConverseStream (not AI SDK).
 */

import type { AssistantEnv } from "./env.js"
import { hasAwsCredentials } from "./env.js"
import { ASSISTANT_SYSTEM_PROMPT } from "./prompt.js"
import type { AssistantChatRequest, AssistantSource } from "./types.js"
import { formatContext } from "./prompt.js"

/**
 * Resolves Bedrock region for Runtime clients.
 *
 * @param env - Assistant env.
 * @returns AWS region string.
 */
export function bedrockRegion(env: AssistantEnv): string {
  return env.LIMETRY_BEDROCK_REGION || env.AWS_REGION || "us-west-2"
}

/**
 * True when Bedrock model synthesis should be attempted.
 *
 * @param env - Assistant env.
 * @returns Whether Converse can run.
 */
export function canUseBedrockConverse(env: AssistantEnv): boolean {
  if (!env.LIMETRY_BEDROCK_MODEL_ID && env.LIMETRY_ASSISTANT_BACKEND !== "bedrock-kb") {
    return false
  }
  return hasAwsCredentials(env)
}

/**
 * Builds Converse message list for a grounded turn.
 *
 * @param message - User question.
 * @param sources - Retrieved evidence.
 * @param history - Prior turns.
 * @returns Bedrock messages.
 */
function buildConverseMessages(
  message: string,
  sources: AssistantSource[],
  history: AssistantChatRequest["history"] = [],
): Array<{ role: "user" | "assistant", content: Array<{ text: string }> }> {
  const context = formatContext(sources)
  const prior = (history ?? []).map((turn) => ({
    role: turn.role,
    content: [{ text: turn.content }],
  }))
  return [
    ...prior,
    {
      role: "user" as const,
      content: [{ text: `Question:\n${message}\n\nSources:\n${context}` }],
    },
  ]
}

/**
 * Generates a full answer with Bedrock Converse.
 *
 * @param env - Assistant env.
 * @param message - User question.
 * @param sources - Retrieved evidence.
 * @param history - Prior turns.
 * @returns Text + model id, or null on failure / unavailable.
 */
export async function generateWithBedrockConverse(
  env: AssistantEnv,
  message: string,
  sources: AssistantSource[],
  history: AssistantChatRequest["history"] = [],
): Promise<{ text: string, model: string } | null> {
  if (!canUseBedrockConverse(env)) {
    return null
  }
  const modelId = env.LIMETRY_BEDROCK_MODEL_ID || "anthropic.claude-3-5-sonnet-20241022-v2:0"
  try {
    const { BedrockRuntimeClient, ConverseCommand } = await import(
      "@aws-sdk/client-bedrock-runtime"
    )
    const client = new BedrockRuntimeClient({ region: bedrockRegion(env) })
    const result = await client.send(new ConverseCommand({
      modelId,
      system: [{ text: ASSISTANT_SYSTEM_PROMPT }],
      messages: buildConverseMessages(message, sources, history),
    }))
    const text = (result.output?.message?.content ?? [])
      .map((block) => ("text" in block ? block.text ?? "" : ""))
      .join("")
      .trim()
    if (!text) {
      return null
    }
    return { text, model: modelId }
  } catch (error) {
    console.warn("[assistant] Bedrock Converse failed; falling back", error)
    return null
  }
}

/**
 * Streams an answer with Bedrock ConverseStream.
 *
 * @param env - Assistant env.
 * @param message - User question.
 * @param sources - Retrieved evidence.
 * @param history - Prior turns.
 * @returns Async text stream + model id, or null.
 */
export async function streamWithBedrockConverse(
  env: AssistantEnv,
  message: string,
  sources: AssistantSource[],
  history: AssistantChatRequest["history"] = [],
): Promise<{ textStream: AsyncIterable<string>, model: string } | null> {
  if (!canUseBedrockConverse(env)) {
    return null
  }
  const modelId = env.LIMETRY_BEDROCK_MODEL_ID || "anthropic.claude-3-5-sonnet-20241022-v2:0"
  try {
    const { BedrockRuntimeClient, ConverseStreamCommand } = await import(
      "@aws-sdk/client-bedrock-runtime"
    )
    const client = new BedrockRuntimeClient({ region: bedrockRegion(env) })
    const result = await client.send(new ConverseStreamCommand({
      modelId,
      system: [{ text: ASSISTANT_SYSTEM_PROMPT }],
      messages: buildConverseMessages(message, sources, history),
    }))
    const events = result.stream
    if (!events) {
      return null
    }

    const streamEvents = events
    async function* textStream(): AsyncIterable<string> {
      for await (const event of streamEvents) {
        const delta = event.contentBlockDelta?.delta
        if (delta && "text" in delta && delta.text) {
          yield delta.text
        }
      }
    }

    return { textStream: textStream(), model: modelId }
  } catch (error) {
    console.warn("[assistant] Bedrock ConverseStream failed; falling back", error)
    return null
  }
}
