/**
 * Environment for Ask Limetry (`@limetry/assistant`).
 */

import { existsSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"

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
  /**
   * When true (default), chat is anonymous behind the CORS allowlist.
   * When false, require `Authorization: Bearer <LIMETRY_ASSISTANT_BEARER_TOKEN>`.
   */
  LIMETRY_ASSISTANT_PUBLIC: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true"),
  /** Shared secret for non-public mode (`Authorization: Bearer …`). */
  LIMETRY_ASSISTANT_BEARER_TOKEN: z.preprocess(emptyStringToUndefined, z.string().optional()),
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
  /**
   * Optional Bedrock API key (bearer). Local/dev alternative to IAM access keys.
   * Recognized by AWS SDKs as `AWS_BEARER_TOKEN_BEDROCK` — not used in Lambda
   * (execution role instead).
   */
  AWS_BEARER_TOKEN_BEDROCK: z.preprocess(emptyStringToUndefined, z.string().optional()),
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
 * True when the AWS SDK default credential chain is likely to resolve.
 *
 * Covers explicit keys/profile/Lambda/container/web-identity env, Bedrock API
 * keys, and the usual `~/.aws/credentials` / `~/.aws/config` files used when
 * `AWS_PROFILE` is unset. Not a guarantee — Converse still catches auth errors.
 *
 * @param env - Assistant env.
 * @returns Whether Bedrock calls are likely to authenticate.
 */
export function hasAwsCredentials(env: AssistantEnv): boolean {
  if (
    env.AWS_BEARER_TOKEN_BEDROCK
    || env.AWS_ACCESS_KEY_ID
    || env.AWS_PROFILE
    || env.AWS_EXECUTION_ENV
    || env.AWS_LAMBDA_FUNCTION_NAME
    || process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI
    || process.env.AWS_CONTAINER_CREDENTIALS_FULL_URI
    || process.env.AWS_WEB_IDENTITY_TOKEN_FILE
    || process.env.AWS_ROLE_ARN
  ) {
    return true
  }
  try {
    const home = process.env.HOME || process.env.USERPROFILE || homedir()
    return existsSync(join(home, ".aws", "credentials"))
      || existsSync(join(home, ".aws", "config"))
  } catch {
    return false
  }
}
