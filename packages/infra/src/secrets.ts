/**
 * SSM Parameter Store copies of runtime secrets for the OSS API.
 *
 * The Lambda process reads the same values from environment variables at boot
 * (`loadEnv`); it does not call SSM at runtime. Neon is not provisioned here —
 * pass a Neon connection string via Pulumi config (see README).
 */

import * as aws from "@pulumi/aws"
import type * as pulumi from "@pulumi/pulumi"

import { getName, getSsmParameterPrefix, getTags } from "./tags.js"

/**
 * Secret and optional Neon metadata inputs for {@link createSecrets}.
 */
export type SecretInputs = {
  /**
   * Postgres connection string stored as `DATABASE_URL`.
   */
  databaseUrl: pulumi.Input<string> | undefined
  /**
   * JWT signing secret.
   */
  jwtSecret: pulumi.Input<string>
  /**
   * API bearer token.
   */
  bearerToken: pulumi.Input<string>
  /**
   * Decision receipt HMAC secret.
   */
  decisionHmacSecret: pulumi.Input<string>
  /**
   * Optional auth signing private key (hex).
   */
  authSigningPrivateKeyHex: pulumi.Input<string> | undefined
  /**
   * Optional Redis / Upstash URL.
   */
  redisUrl: pulumi.Input<string> | undefined
  /**
   * Optional Neon project id for operator metadata.
   */
  neonProjectId: string | undefined
  /**
   * Optional Neon branch id for operator metadata.
   */
  neonBranchId: string | undefined
}

/**
 * Created SSM parameters and the stack parameter prefix.
 */
export type SecretOutputs = {
  /**
   * SSM prefix (`/limetry/${project}/${stack}`).
   */
  parameterPrefix: string
  /**
   * SecureString parameter for `DATABASE_URL`.
   */
  databaseUrlParam: aws.ssm.Parameter | undefined
  /**
   * SecureString parameter for `JWT_SECRET`.
   */
  jwtSecretParam: aws.ssm.Parameter
  /**
   * SecureString parameter for `LIMETRY_BEARER_TOKEN`.
   */
  bearerTokenParam: aws.ssm.Parameter
  /**
   * SecureString parameter for `DECISION_HMAC_SECRET`.
   */
  decisionHmacSecretParam: aws.ssm.Parameter
  /**
   * Optional SecureString for `AUTH_SIGNING_PRIVATE_KEY_HEX`.
   */
  authSigningKeyParam: aws.ssm.Parameter | undefined
  /**
   * Optional SecureString for `REDIS_URL`.
   */
  redisUrlParam: aws.ssm.Parameter | undefined
  /**
   * Optional String metadata for Neon project/branch ids.
   */
  neonMetadataParam: aws.ssm.Parameter | undefined
}

/**
 * Internal args for creating one SSM parameter under the stack prefix.
 */
type SecretParamArgs = {
  /**
   * Logical Pulumi name segment (passed to {@link getName}).
   */
  logicalName: string
  /**
   * Final path segment under the SSM prefix.
   */
  paramName: string
  /**
   * Parameter value (often a secret Output).
   */
  value: pulumi.Input<string>
  /**
   * SSM type; defaults to `SecureString`.
   */
  type?: "SecureString" | "String"
  /**
   * Optional description stored on the parameter.
   */
  description?: string
}

/**
 * Creates an SSM parameter under the stack prefix. `overwrite` allows in-place
 * value updates; path changes still create a new physical parameter.
 *
 * @param args - Logical name, path segment, value, and optional type/description.
 * @returns The managed `aws.ssm.Parameter` resource.
 */
function createSecretParam(args: SecretParamArgs): aws.ssm.Parameter {
  return new aws.ssm.Parameter(getName(args.logicalName), {
    name: `${getSsmParameterPrefix()}/${args.paramName}`,
    type: args.type ?? "SecureString",
    value: args.value,
    overwrite: true,
    description: args.description,
    tags: getTags("secrets"),
  })
}

/**
 * Stores a copy of runtime secrets in SSM Parameter Store (SecureString).
 * The Lambda process reads the same values from environment variables at boot
 * (`loadEnv`); it does not call SSM at runtime.
 * Neon is not provisioned here — pass a Neon connection string via Pulumi config
 * (see README). Optional neonProjectId / neonBranchId are recorded as metadata.
 *
 * @param inputs - Required secrets and optional Redis / Neon metadata.
 * @returns Parameter resources and the stack prefix string.
 */
export function createSecrets(inputs: SecretInputs): SecretOutputs {
  const parameterPrefix = getSsmParameterPrefix()

  const databaseUrlParam = inputs.databaseUrl
    ? createSecretParam({
      logicalName: "database-url",
      paramName: "DATABASE_URL",
      value: inputs.databaseUrl,
      description: "Neon serverless Postgres connection string for Limetry OSS API",
    })
    : undefined

  const jwtSecretParam = createSecretParam({
    logicalName: "jwt-secret",
    paramName: "JWT_SECRET",
    value: inputs.jwtSecret,
  })

  const bearerTokenParam = createSecretParam({
    logicalName: "bearer-token",
    paramName: "LIMETRY_BEARER_TOKEN",
    value: inputs.bearerToken,
  })

  const decisionHmacSecretParam = createSecretParam({
    logicalName: "decision-hmac",
    paramName: "DECISION_HMAC_SECRET",
    value: inputs.decisionHmacSecret,
    description: "HMAC secret for Limetry decision receipts",
  })

  let authSigningKeyParam: aws.ssm.Parameter | undefined
  if (inputs.authSigningPrivateKeyHex !== undefined) {
    authSigningKeyParam = createSecretParam({
      logicalName: "auth-signing-key",
      paramName: "AUTH_SIGNING_PRIVATE_KEY_HEX",
      value: inputs.authSigningPrivateKeyHex,
    })
  }

  let redisUrlParam: aws.ssm.Parameter | undefined
  if (inputs.redisUrl !== undefined) {
    redisUrlParam = createSecretParam({
      logicalName: "redis-url",
      paramName: "REDIS_URL",
      value: inputs.redisUrl,
      description: "Optional Upstash (or compatible) Redis URL — not ElastiCache",
    })
  }

  let neonMetadataParam: aws.ssm.Parameter | undefined
  if (inputs.neonProjectId || inputs.neonBranchId) {
    neonMetadataParam = createSecretParam({
      logicalName: "neon-meta",
      paramName: "NEON_METADATA",
      type: "String",
      value: JSON.stringify({
        projectId: inputs.neonProjectId ?? null,
        branchId: inputs.neonBranchId ?? null,
      }),
      description: "Optional Neon project/branch ids (connection string lives in DATABASE_URL)",
    })
  }

  return {
    parameterPrefix,
    databaseUrlParam,
    jwtSecretParam,
    bearerTokenParam,
    decisionHmacSecretParam,
    authSigningKeyParam,
    redisUrlParam,
    neonMetadataParam,
  }
}
