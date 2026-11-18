/**
 * Environment for Ask Limetry (`@limetry/assistant`).
 */

import { z } from "zod"

function emptyStringToUndefined(value: unknown): unknown {
  if (typeof value !== "string") {
    return value
  }
  const trimmed = value.trim()
  return trimmed.length === 0 ? undefined : trimmed
}

/**
 * Zod schema for assistant runtime env (Lambda or local HTTP).
 */
export const assistantEnvSchema = z.object({
  LIMETRY_ASSISTANT_BACKEND: z.enum(["memory", "pgvector", "bedrock-kb"]).default("memory"),
  LIMETRY_ASSISTANT_CORPUS_PATH: z.string().min(1).default("docs/assistant/corpus/assistant-corpus.json"),
  LIMETRY_ASSISTANT_EXTRA_ROOTS: z.preprocess(emptyStringToUndefined, z.string().optional()),
  LIMETRY_ASSISTANT_PUBLIC: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true"),
  LIMETRY_ASSISTANT_CORS_ORIGINS: z.preprocess(emptyStringToUndefined, z.string().optional()),
  LIMETRY_ASSISTANT_MODEL: z.preprocess(emptyStringToUndefined, z.string().optional()),
  LIMETRY_BEDROCK_KB_ID: z.preprocess(emptyStringToUndefined, z.string().optional()),
  LIMETRY_BEDROCK_MODEL_ID: z.preprocess(emptyStringToUndefined, z.string().optional()),
  LIMETRY_BEDROCK_MODEL_ARN: z.preprocess(emptyStringToUndefined, z.string().optional()),
  LIMETRY_BEDROCK_EMBED_MODEL_ID: z.preprocess(emptyStringToUndefined, z.string().optional()),
  LIMETRY_BEDROCK_GUARDRAIL_ID: z.preprocess(emptyStringToUndefined, z.string().optional()),
  LIMETRY_BEDROCK_GUARDRAIL_VERSION: z.preprocess(emptyStringToUndefined, z.string().optional()),
  LIMETRY_BEDROCK_REGION: z.preprocess(emptyStringToUndefined, z.string().optional()),
  OPENAI_API_KEY: z.preprocess(emptyStringToUndefined, z.string().optional()),
  ANTHROPIC_API_KEY: z.preprocess(emptyStringToUndefined, z.string().optional()),
  AWS_ACCESS_KEY_ID: z.preprocess(emptyStringToUndefined, z.string().optional()),
  AWS_PROFILE: z.preprocess(emptyStringToUndefined, z.string().optional()),
  AWS_REGION: z.preprocess(emptyStringToUndefined, z.string().optional()),
  AWS_EXECUTION_ENV: z.preprocess(emptyStringToUndefined, z.string().optional()),
  AWS_LAMBDA_FUNCTION_NAME: z.preprocess(emptyStringToUndefined, z.string().optional()),
  DATABASE_URL: z.preprocess(emptyStringToUndefined, z.string().optional()),
  ASSISTANT_PORT: z.coerce.number().int().positive().default(3815),
})

/** Parsed assistant env. */
export type AssistantEnv = z.infer<typeof assistantEnvSchema>

/**
 * Loads and validates assistant env from `process.env`.
 *
 * @param source - Env source (defaults to `process.env`).
 * @returns Validated env.
 */
export function loadAssistantEnv(
  source: NodeJS.ProcessEnv = process.env,
): AssistantEnv {
  return assistantEnvSchema.parse(source)
}

/**
 * True when the process can use the default AWS credential chain for Bedrock.
 *
 * @param env - Assistant env.
 * @returns Whether Bedrock calls are likely to authenticate.
 */
export function hasAwsCredentials(env: AssistantEnv): boolean {
  return Boolean(
    env.AWS_ACCESS_KEY_ID
    || env.AWS_PROFILE
    || env.AWS_EXECUTION_ENV
    || env.AWS_LAMBDA_FUNCTION_NAME
    || process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI
    || process.env.AWS_CONTAINER_CREDENTIALS_FULL_URI,
  )
}
