import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

import { AppVersion } from "./app-version"

describe("AppVersion", () => {
  it("matches the root package.json version", () => {
    const packagePath = join(dirname(fileURLToPath(import.meta.url)), "../package.json")
    const rootPackagePath = join(dirname(fileURLToPath(import.meta.url)), "../../../package.json")
    const packageJson = JSON.parse(readFileSync(packagePath, "utf8")) as { version: string }
    const rootPackageJson = JSON.parse(readFileSync(rootPackagePath, "utf8")) as { version: string }

    expect(packageJson.version).toBe(rootPackageJson.version)
    expect(AppVersion()).toBe(`v${packageJson.version}`)
    expect(AppVersion()).toMatch(/^v\d+\.\d+\.\d+/)
  })
})


