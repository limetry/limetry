/**
 * Rewrites `workspace:` dependency ranges to semver while npm packs a package,
 * then restores the original manifest.
 *
 * Yarn needs `workspace:` in git. npm publish does not understand it, and a
 * lasting stamp would have to be reverted by hand. `prepack` calls `prepare`.
 * `npm pack` restores in `postpack`. `npm publish` must not restore there:
 * it re-reads package.json after `postpack` and sends that manifest to the
 * registry. `postpublish` restores after that read.
 *
 * @example
 * ```bash
 * node scripts/rewrite-workspace-protocol.mjs prepare
 * node scripts/rewrite-workspace-protocol.mjs restore-after-pack
 * node scripts/rewrite-workspace-protocol.mjs restore
 * ```
 */
import { existsSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

/** Manifest fields that may contain `workspace:` ranges. */
const DEPENDENCY_FIELDS = [
  "dependencies",
  "optionalDependencies",
  "peerDependencies",
  "devDependencies",
]

/** Backup of the pre-pack manifest, gitignored, removed by restore. */
const BACKUP_NAME = "package.json.pack-backup"

/** Canonical semver, including the optional `-beta.N` prerelease this repo uses. */
const SEMVER_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-beta\.(0|[1-9]\d*))?$/

/**
 * Converts a `workspace:` spec into the semver range npm should publish.
 *
 * `workspace:*` and `workspace:^` become `^version`. `workspace:~` becomes
 * `~version`. Any other spec is returned unchanged.
 *
 * @param {string} range - Dependency range from package.json.
 * @param {string} version - Semver version of the target workspace.
 * @returns {string} Range to write into the packed manifest.
 */
export function dependencyRangeForPublish(range, version) {
  if (!range.startsWith("workspace:")) {
    return range
  }
  const spec = range.slice("workspace:".length)
  if (spec === "*" || spec === "^") {
    return `^${version}`
  }
  if (spec === "~") {
    return `~${version}`
  }
  return spec
}

/**
 * Rejects padded or otherwise non-semver workspace versions before publish.
 *
 * @param {string} version - Version read from a workspace package.json.
 * @param {string} name - Package name, used in the error.
 * @returns {void}
 */
function assertSemver(version, name) {
  if (!SEMVER_PATTERN.test(version)) {
    throw new Error(`Workspace ${name} version is not semver: ${version}`)
  }
}

/**
 * Reads `name` → `version` for every workspace under `packages/` that has both.
 *
 * @param {string} rootDir - Monorepo root.
 * @returns {Map<string, string>} Package name to semver version.
 */
export function readWorkspaceVersions(rootDir) {
  const versions = new Map()
  const packagesDir = join(rootDir, "packages")
  for (const entry of readdirSync(packagesDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue
    }
    const manifestPath = join(packagesDir, entry.name, "package.json")
    if (!existsSync(manifestPath)) {
      continue
    }
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"))
    if (typeof manifest.name === "string" && typeof manifest.version === "string") {
      versions.set(manifest.name, manifest.version)
    }
  }
  return versions
}

/**
 * Replaces `workspace:` ranges in a manifest object with publishable semver.
 *
 * @param {Record<string, unknown>} manifest - Parsed package.json, mutated in place.
 * @param {Map<string, string>} versions - Workspace name to semver version.
 * @returns {boolean} True when at least one range changed.
 */
export function rewriteWorkspaceDependencyRanges(manifest, versions) {
  let changed = false
  for (const field of DEPENDENCY_FIELDS) {
    const dependencies = manifest[field]
    if (!dependencies || typeof dependencies !== "object" || Array.isArray(dependencies)) {
      continue
    }
    for (const [name, range] of Object.entries(dependencies)) {
      if (typeof range !== "string" || !range.startsWith("workspace:")) {
        continue
      }
      const version = versions.get(name)
      if (typeof version !== "string") {
        throw new Error(`Missing semver version for workspace dependency ${name}`)
      }
      assertSemver(version, name)
      const next = dependencyRangeForPublish(range, version)
      if (next !== range) {
        dependencies[name] = next
        changed = true
      }
    }
  }
  return changed
}

/**
 * Backs up package.json and rewrites `workspace:` ranges for the pack step.
 *
 * @param {string} packageDir - Directory containing the package.json to pack.
 * @param {string} rootDir - Monorepo root used to resolve workspace versions.
 * @returns {boolean} True when the manifest was rewritten.
 */
export function preparePackageDir(packageDir, rootDir) {
  const packagePath = join(packageDir, "package.json")
  const backupPath = join(packageDir, BACKUP_NAME)
  if (existsSync(backupPath)) {
    throw new Error(
      `Pack backup already exists at ${backupPath}. Run restore before packing again.`,
    )
  }

  const original = readFileSync(packagePath, "utf8")
  const manifest = JSON.parse(original)
  const changed = rewriteWorkspaceDependencyRanges(manifest, readWorkspaceVersions(rootDir))
  if (!changed) {
    return false
  }

  writeFileSync(backupPath, original)
  try {
    writeFileSync(packagePath, `${JSON.stringify(manifest, null, 2)}\n`)
  } catch (error) {
    writeFileSync(packagePath, original)
    unlinkSync(backupPath)
    throw error
  }
  return true
}

/**
 * `npm publish` re-reads package.json after `postpack`. Restoring in that
 * hook puts `workspace:` back into the manifest the registry stores.
 *
 * @param {string | undefined} npmCommand - `npm_command` from the lifecycle env.
 * @returns {boolean} True when the working tree should be restored now.
 */
export function shouldRestoreAfterPack(npmCommand) {
  return npmCommand !== "publish"
}

/**
 * Reports whether a manifest still contains a `workspace:` range.
 *
 * @param {Record<string, unknown>} manifest - Parsed package.json.
 * @returns {string | null} `name@range` of the first workspace dependency, if any.
 */
export function workspaceDependency(manifest) {
  for (const field of DEPENDENCY_FIELDS) {
    const dependencies = manifest[field]
    if (!dependencies || typeof dependencies !== "object" || Array.isArray(dependencies)) {
      continue
    }
    for (const [name, range] of Object.entries(dependencies)) {
      if (typeof range === "string" && range.startsWith("workspace:")) {
        return `${name}@${range}`
      }
    }
  }
  return null
}

/**
 * Restores package.json from the pack backup when one exists.
 *
 * @param {string} packageDir - Directory that may contain a pack backup.
 * @returns {boolean} True when a backup was restored.
 */
export function restorePackageDir(packageDir) {
  const packagePath = join(packageDir, "package.json")
  const backupPath = join(packageDir, BACKUP_NAME)
  if (!existsSync(backupPath)) {
    return false
  }
  writeFileSync(packagePath, readFileSync(backupPath, "utf8"))
  unlinkSync(backupPath)
  return true
}

/**
 * Returns whether this file is the process entrypoint.
 *
 * @returns {boolean} True when node executed this file directly.
 */
function isDirectRun() {
  const entry = process.argv[1]
  if (!entry) {
    return false
  }
  return resolve(entry) === fileURLToPath(import.meta.url)
}

if (isDirectRun()) {
  const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..")
  const command = process.argv[2]
  const packageDir = process.argv[3] ? resolve(process.argv[3]) : process.cwd()
  try {
    if (command === "prepare") {
      preparePackageDir(packageDir, rootDir)
    } else if (command === "restore-after-pack") {
      if (shouldRestoreAfterPack(process.env.npm_command)) {
        restorePackageDir(packageDir)
      }
    } else if (command === "restore") {
      if (process.env.npm_lifecycle_event === "postpublish") {
        const manifest = JSON.parse(readFileSync(join(packageDir, "package.json"), "utf8"))
        const workspaceRange = workspaceDependency(manifest)
        if (workspaceRange) {
          restorePackageDir(packageDir)
          throw new Error(
            `${manifest.name ?? packageDir} would publish ${workspaceRange}. The registry manifest was read after workspace ranges were restored.`,
          )
        }
      }
      restorePackageDir(packageDir)
    } else {
      console.error(
        "Usage: node scripts/rewrite-workspace-protocol.mjs <prepare|restore-after-pack|restore> [package-dir]",
      )
      process.exit(1)
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  }
}
