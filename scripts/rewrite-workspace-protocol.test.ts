import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import {
  dependencyRangeForPublish,
  preparePackageDir,
  restorePackageDir,
  rewriteWorkspaceDependencyRanges,
} from "./rewrite-workspace-protocol.mjs"

describe("rewrite-workspace-protocol", () => {
  it("maps workspace specs to semver ranges", () => {
    expect(dependencyRangeForPublish("workspace:*", "1.2.42")).toBe("^1.2.42")
    expect(dependencyRangeForPublish("workspace:^", "1.2.42")).toBe("^1.2.42")
    expect(dependencyRangeForPublish("workspace:~", "1.2.42")).toBe("~1.2.42")
    expect(dependencyRangeForPublish("^6.0.0", "1.2.42")).toBe("^6.0.0")
  })

  it("rewrites workspace dependencies and leaves registry ranges", () => {
    const manifest = {
      dependencies: {
        "@limetry/sdk": "workspace:*",
        chalk: "^6.0.0",
      },
      devDependencies: {
        "@limetry/sdk": "workspace:^",
      },
    }
    const versions = new Map([["@limetry/sdk", "1.2.42"]])
    expect(rewriteWorkspaceDependencyRanges(manifest, versions)).toBe(true)
    expect(manifest.dependencies["@limetry/sdk"]).toBe("^1.2.42")
    expect(manifest.dependencies.chalk).toBe("^6.0.0")
    expect(manifest.devDependencies["@limetry/sdk"]).toBe("^1.2.42")
  })

  it("rejects a workspace dependency that has no semver version", () => {
    const manifest = {
      dependencies: {
        "@limetry/sdk": "workspace:*",
      },
    }
    expect(() => rewriteWorkspaceDependencyRanges(manifest, new Map([["@limetry/sdk", "1.2.042"]])))
      .toThrow(/not semver/)
  })

  it("restores the original manifest after prepare", () => {
    const rootDir = mkdtempSync(join(tmpdir(), "limetry-pack-"))
    const sdkDir = join(rootDir, "packages", "sdk")
    const cliDir = join(rootDir, "packages", "cli")
    mkdirSync(sdkDir, { recursive: true })
    mkdirSync(cliDir, { recursive: true })
    writeFileSync(join(sdkDir, "package.json"), "{\n  \"name\": \"@limetry/sdk\",\n  \"version\": \"1.2.42\"\n}\n")
    const original = "{\n  \"name\": \"@limetry/cli\",\n  \"version\": \"1.2.42\",\n  \"dependencies\": {\n    \"@limetry/sdk\": \"workspace:*\"\n  }\n}\n"
    writeFileSync(join(cliDir, "package.json"), original)

    expect(preparePackageDir(cliDir, rootDir)).toBe(true)
    expect(JSON.parse(readFileSync(join(cliDir, "package.json"), "utf8")).dependencies["@limetry/sdk"])
      .toBe("^1.2.42")
    expect(restorePackageDir(cliDir)).toBe(true)
    expect(readFileSync(join(cliDir, "package.json"), "utf8")).toBe(original)
    expect(restorePackageDir(cliDir)).toBe(false)
  })
})
