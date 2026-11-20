import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

import { AppBuild } from "./app-build"

describe("AppBuild", () => {
  it("matches packages/sdk/build-info.json", () => {
    const infoPath = join(dirname(fileURLToPath(import.meta.url)), "../build-info.json")
    const info = JSON.parse(readFileSync(infoPath, "utf8")) as {
      version: string
      build: number
    }

    const result = AppBuild()
    expect(result.version).toBe(info.version)
    expect(result.build).toBe(info.build)
    expect(result.label).toBe(`v${info.version} · ${info.build}`)
  })
})
