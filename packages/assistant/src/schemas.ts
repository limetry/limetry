/**
 * JSON Schema definitions for Ask Limetry (Fastify validation + OpenAPI).
 */

/** POST /api/assistant and /api/assistant/stream request body. */
export const chatBodyJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["message"],
  properties: {
    message: { type: "string", minLength: 1, maxLength: 4_000 },
    history: {
      type: "array",
      maxItems: 20,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["role", "content"],
        properties: {
          role: { type: "string", enum: ["user", "assistant"] },
          content: { type: "string", maxLength: 8_000 },
        },
      },
    },
  },
} as const

/** Citation / source object in chat responses. */
export const assistantSourceJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id", "title", "sourcePath", "snippet", "score"],
  properties: {
    id: { type: "string" },
    title: { type: "string" },
    sourcePath: { type: "string" },
    section: { type: "string" },
    snippet: { type: "string" },
    score: { type: "number" },
    product: { type: "string", enum: ["oss", "cloud"] },
    href: { type: "string" },
  },
} as const

/** Successful non-streaming chat response. */
export const chatSuccessJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["ok", "answer", "sources", "backend"],
  properties: {
    ok: { type: "boolean", const: true },
    answer: { type: "string" },
    sources: { type: "array", items: assistantSourceJsonSchema },
    backend: { type: "string" },
    model: { type: "string" },
  },
} as const

/** Error response body. */
export const errorJsonSchema = {
  type: "object",
  additionalProperties: true,
  required: ["error"],
  properties: {
    error: { type: "string" },
    message: { type: "string" },
    details: {},
  },
} as const

/** Health check response. */
export const healthJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["ok", "service"],
  properties: {
    ok: { type: "boolean", const: true },
    service: { type: "string", const: "ask-limetry" },
  },
} as const

/**
 * Runtime env JSON Schema (validated with Ajv at process start).
 *
 * Empty strings are stripped before validation so optional secrets can be blank
 * in dotenv files.
 */
export const assistantEnvJsonSchema = {
  type: "object",
  additionalProperties: true,
  properties: {
    LIMETRY_ASSISTANT_BACKEND: {
      type: "string",
      enum: ["memory", "pgvector", "bedrock-kb"],
      default: "memory",
    },
    LIMETRY_ASSISTANT_CORPUS_PATH: {
      type: "string",
      minLength: 1,
      default: "docs/assistant/corpus/assistant-corpus.json",
    },
    LIMETRY_ASSISTANT_EXTRA_ROOTS: { type: "string" },
    LIMETRY_ASSISTANT_PUBLIC: {
      type: "string",
      enum: ["true", "false"],
      default: "true",
    },
    LIMETRY_ASSISTANT_BEARER_TOKEN: { type: "string" },
    LIMETRY_ASSISTANT_MODEL: { type: "string" },
    LIMETRY_BEDROCK_KB_ID: { type: "string" },
    LIMETRY_BEDROCK_MODEL_ID: { type: "string" },
    LIMETRY_BEDROCK_MODEL_ARN: { type: "string" },
    LIMETRY_BEDROCK_EMBED_MODEL_ID: { type: "string" },
    LIMETRY_BEDROCK_GUARDRAIL_ID: { type: "string" },
    LIMETRY_BEDROCK_GUARDRAIL_VERSION: { type: "string" },
    LIMETRY_BEDROCK_REGION: { type: "string" },
    OPENAI_API_KEY: { type: "string" },
    ANTHROPIC_API_KEY: { type: "string" },
    AWS_BEARER_TOKEN_BEDROCK: { type: "string" },
    AWS_ACCESS_KEY_ID: { type: "string" },
    AWS_PROFILE: { type: "string" },
    AWS_REGION: { type: "string" },
    AWS_EXECUTION_ENV: { type: "string" },
    AWS_LAMBDA_FUNCTION_NAME: { type: "string" },
    DATABASE_URL: { type: "string" },
    ASSISTANT_PORT: { type: ["string", "number"], default: 3815 },
  },
} as const
