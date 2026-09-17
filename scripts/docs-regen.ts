/**
 * Regenerates API documentation artifacts for the Limetry monorepo.
 *
 * Runs TypeDoc against `typedoc.json`, optionally validates OpenAPI specs under
 * packages that ship them, and exits non-zero when generation fails. Intended for
 * local `yarn docs`, CI (`docs:check`), and the release quality gate.
 *
 * @example
 * ```bash
 * yarn docs
 * yarn docs:check
 * ```
 */

import { spawnSync } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..")

/**
 * CLI flags for the docs regeneration runner.
 */
export type DocsRegenArgs = {
  /**
   * When true, print usage and exit.
   */
  help: boolean
  /**
   * When true, only validate OpenAPI artifacts (skip TypeDoc).
   */
  openapiOnly: boolean
  /**
   * When true, skip OpenAPI file presence checks.
   */
  skipOpenapi: boolean
}

/**
 * Parses argv for the docs regen CLI.
 *
 * @param argv - Process arguments after the node/tsx script path.
 * @returns Normalized flags.
 */
export function parseDocsRegenArgs(argv: string[]): DocsRegenArgs {
  return {
    help: argv.includes("--help") || argv.includes("-h"),
    openapiOnly: argv.includes("--openapi-only"),
    skipOpenapi: argv.includes("--skip-openapi"),
  }
}

/**
 * Runs a yarn script in the monorepo root and throws on non-zero exit.
 *
 * @param args - Arguments passed to `yarn`.
 * @returns Nothing.
 */
function runYarn(args: string[]): void {
  const result = spawnSync("yarn", args, {
    cwd: ROOT_DIR,
    stdio: "inherit",
    env: process.env,
  })
  if (result.status !== 0) {
    throw new Error(`yarn ${args.join(" ")} failed (exit ${result.status ?? 1})`)
  }
}

/**
 * Asserts that a JSON or YAML OpenAPI document exists and is non-empty.
 *
 * @param relativePath - Path relative to the monorepo root.
 * @returns Nothing.
 */
export function assertOpenApiPresent(relativePath: string): void {
  const absolute = join(ROOT_DIR, relativePath)
  if (!existsSync(absolute)) {
    throw new Error(`Missing OpenAPI artifact: ${relativePath}`)
  }
  const raw = readFileSync(absolute, "utf8").trim()
  if (raw.length === 0) {
    throw new Error(`OpenAPI artifact is empty: ${relativePath}`)
  }
  if (relativePath.endsWith(".json")) {
    const parsed = JSON.parse(raw) as { openapi?: string }
    if (typeof parsed.openapi !== "string") {
      throw new Error(`OpenAPI JSON missing openapi version field: ${relativePath}`)
    }
  } else if (!/^openapi:\s*['"]?3\./m.test(raw)) {
    throw new Error(`OpenAPI YAML missing openapi 3.x header: ${relativePath}`)
  }
}

/**
 * Regenerates TypeDoc HTML under docs/api and validates known OpenAPI paths.
 *
 * @param args - CLI flags.
 * @returns Nothing.
 */
export function regenerateDocs(args: DocsRegenArgs = {
  help: false,
  openapiOnly: false,
  skipOpenapi: false,
}): void {
  if (args.help) {
    console.log(`Usage:
  yarn docs              Generate TypeDoc + validate OpenAPI artifacts
  yarn docs:api          TypeDoc only
  yarn docs:api:watch    TypeDoc watch mode
  yarn docs:check        Same as yarn docs (CI / release gate)
  yarn docs:openapi      Validate OpenAPI artifacts only
`)
    return
  }

  if (!args.openapiOnly) {
    console.log("Generating TypeDoc API docs...")
    runYarn(["docs:api"])
  }

  if (!args.skipOpenapi) {
    console.log("Validating OpenAPI artifacts...")
    const candidates = [
      "packages/server/openapi.yaml",
      "examples/chatgpt-custom-gpt-payment-governance/openapi.json",
    ]
    for (const candidate of candidates) {
      if (existsSync(join(ROOT_DIR, candidate))) {
        assertOpenApiPresent(candidate)
        console.log(`  ok ${candidate}`)
      }
    }
    if (existsSync(join(ROOT_DIR, "packages/server/scripts/sync-openapi.mjs"))) {
      runYarn(["workspace", "@limetry/server", "sync:openapi"])
    }
  }

  console.log("Docs regeneration complete (output: docs/api, gitignored).")
}

function main(): void {
  try {
    regenerateDocs(parseDocsRegenArgs(process.argv.slice(2)))
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  }
}

const entry = process.argv[1]
if (entry && /docs-regen\.(ts|js|mjs)$/.test(entry)) {
  main()
}
