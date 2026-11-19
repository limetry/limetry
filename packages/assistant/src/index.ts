/**
 * `@limetry/assistant` — Ask Limetry product chat for limetry.org.
 */

export {
  DEFAULT_BEDROCK_MODEL_ID,
  canUseBedrockConverse,
  generateWithBedrockConverse,
  resolveBedrockModelId,
  streamWithBedrockConverse,
} from "./bedrock-converse.js"
export {
  hasLlmProvider,
  prepareAssistantChatStream,
  resolveAssistantBackend,
  retrieveSources,
  runAssistantChat,
} from "./chat.js"
export { createAssistantApp } from "./create-app.js"
export {
  type AssistantEnv,
  assistantEnvSchema,
  hasAwsCredentials,
  loadAssistantEnv,
} from "./env.js"
export { chatCorsOriginVariants, createChatRoutes } from "./http-routes.js"
export type {
  AssistantBackendName,
  AssistantChatRequest,
  AssistantChatResponse,
  AssistantChunk,
  AssistantCorpusFile,
  AssistantProduct,
  AssistantSource,
} from "./types.js"
