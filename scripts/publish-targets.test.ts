import { describe, expect, it } from "vitest"

import {
  packagePublishTag,
  parsePublishSelection,
  PUBLISHABLE_PACKAGES,
} from "./publish-targets.js"

describe("npm publish targets", () => {
  it("selects no packages for an empty choice", () => {
    expect(parsePublishSelection("")).toEqual([])
    expect(parsePublishSelection("none")).toEqual([])
  })

  it("selects all publishable packages in canonical order", () => {
    expect(parsePublishSelection("all")).toEqual(PUBLISHABLE_PACKAGES)
  })

  it("normalizes package keys and removes duplicates", () => {
    expect(parsePublishSelection("ui, sdk,ui")).toEqual(["sdk", "ui"])
  })

  it("includes internal packages required by selected packages", () => {
    expect(parsePublishSelection("cli")).toEqual(["cli", "sdk"])
  })

  it("rejects unknown package keys", () => {
    expect(() => parsePublishSelection("sdk,server")).toThrow("Unknown publish package(s): server")
  })

  it("uses the workflow tag format", () => {
    expect(packagePublishTag("preflight", "1.2.041")).toBe("preflight-v1.2.041")
  })
})
