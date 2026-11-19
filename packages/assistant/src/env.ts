/**
 * Environment for Ask Limetry (`@limetry/assistant`).
 *
 * Validated with Ajv + JSON Schema (no Zod).
 */

import { existsSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"

import { Ajv } from "ajv"

import { assistantEnvJsonSchema } from "./schemas.js"

/** Parsed assistant env after JSON Schema validation + coercion. */
export type AssistantEnv = {
  LIMETRY_ASSISTANT_BACKEND: "memory" | "pgvector" | "bedrock-kb"
  LIMETRY_ASSISTANT_CORPUS_PATH: string
  LIMETRY_ASSISTANT_EXTRA_ROOTS?: string
  LIMETRY_ASSISTANT_PUBLIC: boolean
  LIMETRY_ASSISTANT_BEARER_TOKEN?: string
  LIMETRY_ASSISTANT_MODEL?: string
  LIMETRY_BEDROCK_KB_ID?: string
  LIMETRY_BEDROCK_MODEL_ID?: string
  LIMETRY_BEDROCK_MODEL_ARN?: string
  LIMETRY_BEDROCK_EMBED_MODEL_ID?: string
  LIMETRY_BEDROCK_GUARDRAIL_ID?: string
  LIMETRY_BEDROCK_GUARDRAIL_VERSION?: string
  LIMETRY_BEDROCK_REGION?: string
  OPENAI_API_KEY?: string
  ANTHROPIC_API_KEY?: string
  AWS_BEARER_TOKEN_BEDROCK?: string
  AWS_ACCESS_KEY_ID?: string
  AWS_PROFILE?: string
  AWS_REGION?: string
  AWS_EXECUTION_ENV?: string
  AWS_LAMBDA_FUNCTION_NAME?: string
  DATABASE_URL?: string
  ASSISTANT_PORT: number
}

const ajv = new Ajv({
  useDefaults: true,
  coerceTypes: true,
  removeAdditional: false,
  allErrors: true,
})

const validateEnv = ajv.compile(assistantEnvJsonSchema)

/**
 * Drops blank string values so optional secrets can be empty in dotenv.
 *
 * @param source - Raw env map.
 * @returns Shallow copy without empty strings.
 */
function stripEmptyStrings(
  source: NodeJS.ProcessEnv,
): Record<string, string | undefined> {
  const next: Record<string, string | undefined> = {}
  for (const [key, value] of Object.entries(source)) {
    if (typeof value !== "string") {
      continue
    }
    const trimmed = value.trim()
    if (trimmed.length > 0) {
      next[key] = trimmed
    }
  }
  return next
}

/**
 * Loads and validates assistant env from `process.env` (or a test override).
 *
 * @param source - Env source (defaults to `process.env`).
 * @returns Validated env.
 */
export function loadAssistantEnv(
  source: NodeJS.ProcessEnv = process.env,
): AssistantEnv {
  const candidate = stripEmptyStrings(source)
  if (!validateEnv(candidate)) {
    const details = ajv.errorsText(validateEnv.errors, { separator: "; " })
    throw new Error(`Invalid assistant env: ${details}`)
  }
  const data = candidate as Record<string, unknown>
  const publicRaw = data.LIMETRY_ASSISTANT_PUBLIC
  const portRaw = data.ASSISTANT_PORT
  return {
    LIMETRY_ASSISTANT_BACKEND: (data.LIMETRY_ASSISTANT_BACKEND as AssistantEnv["LIMETRY_ASSISTANT_BACKEND"])
      || "memory",
    LIMETRY_ASSISTANT_CORPUS_PATH: String(
      data.LIMETRY_ASSISTANT_CORPUS_PATH
        || "docs/assistant/corpus/assistant-corpus.json",
    ),
    LIMETRY_ASSISTANT_EXTRA_ROOTS: data.LIMETRY_ASSISTANT_EXTRA_ROOTS as string | undefined,
    LIMETRY_ASSISTANT_PUBLIC: publicRaw !== "false" && publicRaw !== false,
    LIMETRY_ASSISTANT_BEARER_TOKEN: data.LIMETRY_ASSISTANT_BEARER_TOKEN as string | undefined,
    LIMETRY_ASSISTANT_MODEL: data.LIMETRY_ASSISTANT_MODEL as string | undefined,
    LIMETRY_BEDROCK_KB_ID: data.LIMETRY_BEDROCK_KB_ID as string | undefined,
    LIMETRY_BEDROCK_MODEL_ID: data.LIMETRY_BEDROCK_MODEL_ID as string | undefined,
    LIMETRY_BEDROCK_MODEL_ARN: data.LIMETRY_BEDROCK_MODEL_ARN as string | undefined,
    LIMETRY_BEDROCK_EMBED_MODEL_ID: data.LIMETRY_BEDROCK_EMBED_MODEL_ID as string | undefined,
    LIMETRY_BEDROCK_GUARDRAIL_ID: data.LIMETRY_BEDROCK_GUARDRAIL_ID as string | undefined,
    LIMETRY_BEDROCK_GUARDRAIL_VERSION: data.LIMETRY_BEDROCK_GUARDRAIL_VERSION as string | undefined,
    LIMETRY_BEDROCK_REGION: data.LIMETRY_BEDROCK_REGION as string | undefined,
    OPENAI_API_KEY: data.OPENAI_API_KEY as string | undefined,
    ANTHROPIC_API_KEY: data.ANTHROPIC_API_KEY as string | undefined,
    AWS_BEARER_TOKEN_BEDROCK: data.AWS_BEARER_TOKEN_BEDROCK as string | undefined,
    AWS_ACCESS_KEY_ID: data.AWS_ACCESS_KEY_ID as string | undefined,
    AWS_PROFILE: data.AWS_PROFILE as string | undefined,
    AWS_REGION: data.AWS_REGION as string | undefined,
    AWS_EXECUTION_ENV: data.AWS_EXECUTION_ENV as string | undefined,
    AWS_LAMBDA_FUNCTION_NAME: data.AWS_LAMBDA_FUNCTION_NAME as string | undefined,
    DATABASE_URL: data.DATABASE_URL as string | undefined,
    ASSISTANT_PORT: Number(portRaw ?? 3815),
  }
}

/** @deprecated Use {@link loadAssistantEnv}; kept for OpenAPI/docs naming. */
export const assistantEnvSchema = assistantEnvJsonSchema

/**
 * True when the AWS SDK default credential chain is likely to resolve.
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
