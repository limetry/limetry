/**
 * `@limetry/assistant` — Ask Limetry product chat library for limetry.org.
 *
 * HTTP hosting lives in `@limetry/api` (depends on this package).
 */

export {
  canUseBedrockConverse,
  DEFAULT_BEDROCK_MODEL_ID,
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
export { clearCorpusCache } from "./corpus.js"
export {
  type AssistantEnv,
  assistantEnvSchema,
  hasAwsCredentials,
  loadAssistantEnv,
} from "./env.js"
export {
  assistantEnvJsonSchema,
  assistantSourceJsonSchema,
  chatBodyJsonSchema,
  chatSuccessJsonSchema,
  errorJsonSchema,
  healthJsonSchema,
} from "./schemas.js"
export type {
  AssistantBackendName,
  AssistantChatRequest,
  AssistantChatResponse,
  AssistantChunk,
  AssistantCorpusFile,
  AssistantProduct,
  AssistantSource,
} from "./types.js"
