import { describe, expect, it } from "vitest"

import {
  computeNextVersion,
  deployTargetFromChoice,
  formatAppVersionSource,
  formatVersion,
  parseReleaseCliArgs,
  parseVersion,
  releaseTypeFromChoice,
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
  })

  it("bumps padded patch versions", () => {
    expect(computeNextVersion("1.0.0", "patch")).toBe("1.0.001")
    expect(computeNextVersion("1.0.001", "patch")).toBe("1.0.002")
    expect(computeNextVersion("1.0.009", "minor")).toBe("1.1.000")
    expect(computeNextVersion("1.1.000", "major")).toBe("2.0.000")
  })

  it("formats APP_VERSION source", () => {
    expect(formatAppVersionSource("1.0.001")).toBe("export const APP_VERSION = \"1.0.001\"\n")
    expect(formatVersion({ major: 1, minor: 0, patch: 1, beta: null }, false)).toBe("1.0.001")
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
