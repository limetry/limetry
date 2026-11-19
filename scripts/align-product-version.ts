/**
 * Fans the root product semver out to publishable workspaces after releasekit
 * stamps `package.json` (and optional workspace package.json targets).
 *
 * - Sets `@limetry/*` caret ranges to `^<version>` for npm publish
 * - Rewrites `versions/compatibility.json` + SDK/web compatibility exports
 * - Refreshes `yarn.lock` when the published SDK range descriptor is missing
 *
 * Invoked from `yarn sync-version` and the releasekit quality gate. Root
 * `package.json` remains the single source of truth for the product version.
 */

import { spawnSync } from "node:child_process"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import {
  canonicalizeVersion,
  lockfileRecordsPublishedSdkRange,
  PUBLISHABLE_WORKSPACES,
  setPackageVersionText,
  setPublishedLimetryDependencyRanges,
} from "./release-version.js"
import {
  buildCompatibility,
  publishCompatibility,
  readSchemaCatalog,
} from "./schema-versions.js"

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..")

/** Workspaces that share the product semver (npm + site + assistant lambda). */
const VERSIONED_WORKSPACES = [
  ...PUBLISHABLE_WORKSPACES,
  "packages/web",
  "packages/assistant",
] as const

const PUBLISHED_PACKAGE_NAMES = [
  "@limetry/ci",
  "@limetry/cli",
  "@limetry/mcp",
  "@limetry/preflight",
  "@limetry/sdk",
  "@limetry/shopify",
  "@limetry/sql",
  "@limetry/ui",
] as const

/**
 * Absolute paths releasekit should commit in addition to stamp targets
 * (compatibility docs + lockfile after this align step).
 */
export const ALIGN_EXTRA_PATHS = [
  "versions/compatibility.json",
  "packages/sdk/src/compatibility.ts",
  "packages/web/public/compatibility.json",
  "yarn.lock",
] as const

/**
 * package.json paths releasekit must stamp so product version stays aligned.
 */
export const PRODUCT_PACKAGE_JSON_STAMP_PATHS = [
  "package.json",
  ...VERSIONED_WORKSPACES.map((workspace) => `${workspace}/package.json`),
] as const

function readRootVersion(): string {
  const raw = readFileSync(join(ROOT_DIR, "package.json"), "utf8")
  const version = (JSON.parse(raw) as { version?: string }).version
  if (!version?.trim()) {
    throw new Error("limetry/package.json is missing version")
  }
  return canonicalizeVersion(version)
}

/**
 * Aligns workspace manifests and compatibility docs to the root product version.
 *
 * @param version - Optional override; defaults to root `package.json`.
 * @returns Nothing.
 */
export function alignProductVersion(version = readRootVersion()): void {
  const canonical = canonicalizeVersion(version)

  for (const workspace of VERSIONED_WORKSPACES) {
    const absolute = join(ROOT_DIR, workspace, "package.json")
    if (!existsSync(absolute)) {
      continue
    }
    const source = readFileSync(absolute, "utf8")
    const withVersion = setPackageVersionText(source, canonical)
    const withRanges = setPublishedLimetryDependencyRanges(withVersion, canonical)
    if (withRanges !== source) {
      writeFileSync(absolute, withRanges)
    }
  }

  const catalog = readSchemaCatalog(join(ROOT_DIR, "versions/schemas.json"))
  const document = buildCompatibility({
    product: canonical,
    packages: PUBLISHED_PACKAGE_NAMES,
    websites: ["@limetry/web"],
    schemas: catalog.schemas,
  })
  publishCompatibility({
    document,
    jsonPaths: [
      join(ROOT_DIR, "versions/compatibility.json"),
      join(ROOT_DIR, "packages/web/public/compatibility.json"),
    ],
    modulePath: join(ROOT_DIR, "packages/sdk/src/compatibility.ts"),
  })

  const lockfilePath = join(ROOT_DIR, "yarn.lock")
  if (existsSync(lockfilePath)) {
    const lockfile = readFileSync(lockfilePath, "utf8")
    if (!lockfileRecordsPublishedSdkRange(lockfile, canonical)) {
      const env = { ...process.env }
      delete env.CI
      delete env.GITHUB_ACTIONS
      const result = spawnSync("yarn", ["install"], {
        cwd: ROOT_DIR,
        stdio: "inherit",
        env,
      })
      if (result.status !== 0) {
        throw new Error(`yarn install failed while aligning lockfile for ${canonical}`)
      }
    }
  }

  console.log(`Aligned product version ${canonical} across publishable workspaces`)
}

function main(): void {
  try {
    alignProductVersion(process.argv[2])
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  }
}

const entry = process.argv[1]
if (entry && /align-product-version\.(ts|js|mjs)$/.test(entry)) {
  main()
}
