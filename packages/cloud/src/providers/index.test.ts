import { describe, expect, it } from "vitest"

import { getServerlessProviderFactory } from "./index"

/** Verifies serverless provider adapter selection. */
describe("serverless provider selection", () => {
  /** Verifies each supported provider resolves to a factory. */
  it("selects every supported provider", () => {
    expect(getServerlessProviderFactory("aws")).toBeTypeOf("function")
    expect(getServerlessProviderFactory("gcp")).toBeTypeOf("function")
    expect(getServerlessProviderFactory("azure")).toBeTypeOf("function")
  })
})
