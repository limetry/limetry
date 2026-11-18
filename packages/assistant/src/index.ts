/**
 * `@limetry/assistant` — Ask Limetry product chat for limetry.org.
 */

export {
  hasLlmProvider,
  prepareAssistantChatStream,
  resolveAssistantBackend,
  retrieveSources,
  runAssistantChat,
} from "./chat.js"
export {
  canUseBedrockConverse,
  generateWithBedrockConverse,
  streamWithBedrockConverse,
} from "./bedrock-converse.js"
export { createAssistantApp } from "./create-app.js"
export {
  assistantEnvSchema,
  hasAwsCredentials,
  loadAssistantEnv,
  type AssistantEnv,
} from "./env.js"
export { createChatRoutes, chatCorsOriginVariants } from "./http-routes.js"
export type {
  AssistantBackendName,
  AssistantChatRequest,
  AssistantChatResponse,
  AssistantChunk,
  AssistantCorpusFile,
  AssistantProduct,
  AssistantSource,
} from "./types.js"
