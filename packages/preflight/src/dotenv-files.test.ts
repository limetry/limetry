import { mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import { annotated, listEffectiveDotenvFiles } from "./dotenv-files.js"

describe("dotenv file listing", () => {
  it("reports Vercel project environment", () => {
    expect(listEffectiveDotenvFiles({ VERCEL: "1" })).toBe("Vercel project environment (dotenvx skipped)")
  })

  it("lists existing dotenv files relative to cwd", () => {
    const dir = mkdtempSync(join(tmpdir(), "preflight-"))
    writeFileSync(join(dir, ".env"), "FOO=1\n")
    writeFileSync(join(dir, ".env.local"), "FOO=2\n")
    expect(listEffectiveDotenvFiles({}, dir)).toBe(".env, .env.local")
  })

  it("reports process.env only when none exist", () => {
    const dir = mkdtempSync(join(tmpdir(), "preflight-empty-"))
    expect(listEffectiveDotenvFiles({}, dir)).toBe("none (process.env only)")
  })
})

describe("annotated", () => {
  it("marks values that came from defaults", () => {
    expect(annotated("LIMETRY_API_PORT", "3810", {})).toBe("3810  (from default)")
    expect(annotated("LIMETRY_API_PORT", "3810", { LIMETRY_API_PORT: "3810" })).toBe("3810")
  })
})
