import { output } from "@pulumi/pulumi"
import { describe, expect, it } from "vitest"

import { buildServerlessConfig } from "../config"
import { createProvider, getProviderFactory } from "./index"
import type { ProviderArgs } from "./types"

describe("getProviderFactory", () => {
  it("returns a factory for each supported provider", () => {
    expect(getProviderFactory("aws")).toBeTypeOf("function")
    expect(getProviderFactory("gcp")).toBeTypeOf("function")
    expect(getProviderFactory("azure")).toBeTypeOf("function")
  })

  it("creates resources with the selected factory", () => {
    const args: ProviderArgs = {
      config: buildServerlessConfig({}),
      environment: {},
      name: "test",
      repoRoot: ".",
      secrets: {
        bearerToken: "bearer",
        databasePassword: "password",
        decisionHmacSecret: "hmac",
        jwtSecret: "jwt",
      },
    }
    const resources = createProvider(() => ({
      apiImageReference: "image",
      apiUrl: output("https://api.example.com"),
      provider: "aws",
    }), args)

    expect(resources.provider).toBe("aws")
    expect(resources.apiImageReference).toBe("image")
  })
})
