#!/usr/bin/env node
/**
 * Stamps a workspace package.json version from the monorepo root before npm
 * publish. Workspace packages intentionally omit `version` in git; this script
 * normalizes the root release version to semver and stamps the target manifest.
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
const rootVersion = rootPackage.version
if (typeof rootVersion !== "string" || !rootVersion.trim()) {
  console.error("Root package.json is missing version")
  process.exit(1)
}

const versionParts = rootVersion.trim().match(/^(\d+)\.(\d+)\.(\d+)(?:-beta\.(\d+))?$/)
if (!versionParts) {
  console.error(`Unsupported root version: ${rootVersion}`)
  process.exit(1)
}

const numericParts = versionParts.slice(1, 4).map(Number)
const betaNumber = versionParts[4] == null ? null : Number(versionParts[4])
if (
  numericParts.some((part) => !Number.isSafeInteger(part))
  || (betaNumber != null && !Number.isSafeInteger(betaNumber))
) {
  console.error(`Root version contains an unsafe numeric component: ${rootVersion}`)
  process.exit(1)
}

const beta = betaNumber == null ? "" : `-beta.${betaNumber}`
const version = `${numericParts.join(".")}${beta}`

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
console.log(`Stamped ${packagePath} @ ${version} (root release ${rootVersion})`)
