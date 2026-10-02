import { describe, expect, it } from "vitest"

import {
  canonicalizeVersion,
  computeNextVersion,
  deployTargetFromChoice,
  formatAppVersionSource,
  formatVersion,
  parseReleaseCliArgs,
  parseVersion,
  releaseTypeFromChoice,
  setPackageVersionText,
} from "./release-version.js"

describe("release-version", () => {
  it("parses padded and unpadded patch versions", () => {
    expect(parseVersion("1.0.0")).toEqual({
      major: 1,
      minor: 0,
      patch: 0,
      beta: null,
    })
    expect(parseVersion("1.2.003")).toEqual({
      major: 1,
      minor: 2,
      patch: 3,
      beta: null,
    })
    expect(canonicalizeVersion("1.2.042")).toBe("1.2.42")
    expect(canonicalizeVersion("1.2.42-beta.1")).toBe("1.2.42-beta.1")
  })

  it("bumps semver patch versions", () => {
    expect(computeNextVersion("1.0.0", "patch")).toBe("1.0.1")
    expect(computeNextVersion("1.0.1", "patch")).toBe("1.0.2")
    expect(computeNextVersion("1.0.9", "minor")).toBe("1.1.0")
    expect(computeNextVersion("1.1.0", "major")).toBe("2.0.0")
    expect(computeNextVersion("1.2.042", "patch")).toBe("1.2.43")
  })

  it("formats APP_VERSION source", () => {
    expect(formatAppVersionSource("1.0.1")).toBe("export const APP_VERSION = \"1.0.1\"\n")
    expect(formatVersion({ major: 1, minor: 0, patch: 1, beta: null }, false)).toBe("1.0.1")
  })

  it("writes a semver version into package.json text", () => {
    const source = "{\n  \"name\": \"@limetry/sdk\",\n  \"description\": \"sdk\"\n}\n"
    const withVersion = setPackageVersionText(source, "1.2.042")
    expect(withVersion).toContain("\"version\": \"1.2.42\"")
    expect(JSON.parse(withVersion)).toMatchObject({
      name: "@limetry/sdk",
      version: "1.2.42",
      description: "sdk",
    })
    expect(setPackageVersionText(withVersion, "1.2.43")).toContain("\"version\": \"1.2.43\"")
    expect(setPackageVersionText(withVersion, "1.2.42")).toBe(withVersion)
  })

  it("parses CLI flags", () => {
    expect(releaseTypeFromChoice("2")).toBe("minor")
    expect(parseReleaseCliArgs(["--patch", "--yes"])).toEqual({
      bump: "patch",
      deploy: null,
      yes: true,
      syncOnly: false,
      help: false,
    })
    expect(parseReleaseCliArgs(["--deploy=aws"])).toEqual({
      bump: null,
      deploy: "aws",
      yes: false,
      syncOnly: false,
      help: false,
    })
    expect(parseReleaseCliArgs(["--vercel", "--yes"])).toEqual({
      bump: null,
      deploy: "vercel",
      yes: true,
      syncOnly: false,
      help: false,
    })
    expect(parseReleaseCliArgs(["--deploy", "skip"])).toEqual({
      bump: null,
      deploy: "skip",
      yes: false,
      syncOnly: false,
      help: false,
    })
  })

  it("maps deploy prompt choices", () => {
    expect(deployTargetFromChoice("")).toBe("aws")
    expect(deployTargetFromChoice("1")).toBe("aws")
    expect(deployTargetFromChoice("2")).toBe("vercel")
    expect(deployTargetFromChoice("3")).toBe("skip")
    expect(deployTargetFromChoice("vercel")).toBe("vercel")
  })
})
