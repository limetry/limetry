#!/usr/bin/env node
/**
 * Stamps a workspace package.json version from the monorepo root before npm
 * publish. Workspace packages intentionally omit `version` in git; this script
 * writes the root version into the target package.json at publish time.
 *
 * Inputs:
 * - argv[2]: workspace path relative to repo root, absolute package dir, or
 *   absolute path ending in `package.json`
 *
 * Side effects:
 * - Reads root `package.json` for `version`
 * - Overwrites the target package.json `version` field (pretty-printed + newline)
 * - Exits `1` on missing argv, missing root version, or I/O/parse errors
 *
 * @example
 * ```bash
 * node scripts/stamp-publish-version.mjs packages/sdk
 * node scripts/stamp-publish-version.mjs /abs/path/to/package
 * ```
 */
import { readFileSync, writeFileSync } from "node:fs"
import { dirname, isAbsolute, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

/** Absolute path to the monorepo root (parent of `scripts/`). */
const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..")
/** Workspace path or package.json path from argv. */
const target = process.argv[2]

if (!target) {
  console.error("Usage: node scripts/stamp-publish-version.mjs <workspace-path>")
  console.error("Example: node scripts/stamp-publish-version.mjs packages/sdk")
  process.exit(1)
}

const rootPackage = JSON.parse(readFileSync(join(rootDir, "package.json"), "utf8"))
const version = rootPackage.version
if (typeof version !== "string" || !version.trim()) {
  console.error("Root package.json is missing version")
  process.exit(1)
}

/**
 * Resolves the package.json path to stamp from argv `target`.
 * Relative paths are joined under the monorepo root; absolute paths may be a
 * directory or a direct `package.json` file path.
 */
const packagePath = isAbsolute(target)
  ? (target.endsWith("package.json") ? target : join(target, "package.json"))
  : join(rootDir, target, "package.json")

const packageJson = JSON.parse(readFileSync(packagePath, "utf8"))
packageJson.version = version
writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`)
console.log(`Stamped ${packagePath} @ ${version}`)
