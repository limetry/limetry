import { describe, expect, it } from "vitest"

import { canUseBedrockConverse, resolveBedrockModelId } from "./bedrock-converse.js"
import { hasAwsCredentials, loadAssistantEnv } from "./env.js"

describe("assistant env / Bedrock gating", () => {
  it("allows Bedrock Converse with credentials even when model id is unset", () => {
    const env = loadAssistantEnv({
      LIMETRY_ASSISTANT_BACKEND: "memory",
      AWS_PROFILE: "disrupt",
    })
    expect(env.LIMETRY_BEDROCK_MODEL_ID).toBeUndefined()
    expect(hasAwsCredentials(env)).toBe(true)
    expect(canUseBedrockConverse(env)).toBe(true)
    expect(resolveBedrockModelId(env)).toBe("us.anthropic.claude-sonnet-4-6")
  })

  it("treats AWS web identity env as available credentials", () => {
    const previous = process.env.AWS_WEB_IDENTITY_TOKEN_FILE
    process.env.AWS_WEB_IDENTITY_TOKEN_FILE = "/tmp/token"
    try {
      const env = loadAssistantEnv({
        LIMETRY_ASSISTANT_BACKEND: "memory",
      })
      expect(hasAwsCredentials(env)).toBe(true)
    } finally {
      if (previous === undefined) {
        delete process.env.AWS_WEB_IDENTITY_TOKEN_FILE
      } else {
        process.env.AWS_WEB_IDENTITY_TOKEN_FILE = previous
      }
    }
  })
})
