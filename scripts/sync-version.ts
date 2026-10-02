/**
 * Interactive production release and version sync for the limetry monorepo.
 *
 * Bumps the root package.json and every publishable workspace package.json to
 * the same semver, stamps `packages/sdk/src/app-version.ts`, runs a quality
 * gate, commits/tags, then deploys via AWS (Pulumi) or watches GitHub→Vercel.
 *
 * CLI: `yarn release`, `yarn release:aws`, `yarn release:vercel`, `yarn sync-version`.
 * Exports version-stamping helpers for tests.
 */

import { spawnSync } from "node:child_process"
import { readFileSync, writeFileSync } from "node:fs"
import { dirname, join, relative, resolve } from "node:path"
import readline from "node:readline"
import { fileURLToPath } from "node:url"

import {
  canonicalizeVersion,
  computeNextVersion,
  type DeployTarget,
  deployTargetFromChoice,
  formatAppVersionSource,
  isStableReleaseBranch,
  parseReleaseCliArgs,
  PUBLISHABLE_WORKSPACES,
  type ReleaseBump,
  releaseTypeFromChoice,
  setPackageVersionText,
} from "./release-version.js"
import { watchVercelCommit } from "./watch-vercel.js"

/** Loose package.json shape used when reading/writing the root version. */
type PackageJson = {
  version?: string
  [key: string]: unknown
}

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const PACKAGE_JSON_PATH = join(ROOT_DIR, "package.json")
const APP_VERSION_PATH = join(ROOT_DIR, "packages/sdk/src/app-version.ts")

/** Relative paths touched by a version stamp (for docs / tests). */
const VERSION_FILES = [
  "package.json",
  ...PUBLISHABLE_WORKSPACES.map((workspace) => `${workspace}/package.json`),
  "packages/sdk/src/app-version.ts",
]

/**
 * Prints CLI usage for `yarn release` / sync-version.
 *
 * @returns Nothing.
 */
function printHelp(): void {
  console.log(`Usage:
  yarn release                 Interactive production release (main/master)
  yarn release:aws             Release then deploy AWS (Pulumi), no deploy prompt
  yarn release:vercel          Push release then watch GitHub→Vercel deploys
  yarn release --patch --yes   Non-interactive patch release
  yarn release --minor --yes
  yarn release --major --yes
  yarn release --deploy=skip   Skip post-release deploy
  yarn sync-version            Re-stamp publishable manifests from root (no bump)

Bumps the root package.json and every publishable workspace package.json to
the same semver, stamps packages/sdk APP_VERSION, runs a quality gate, then
commits and tags locally. Pushing the release tag triggers npm publishing for
all public packages at the same version. npm publish rewrites workspace:
ranges while packing and restores the manifests afterward.

AWS: runs Pulumi before push; failed deploys roll back the local commit/tag.
Vercel: pushes to origin (GitHub webhook), then watches production deploys for
that commit SHA until READY. Failed Vercel builds cannot un-push; fix forward
or revert. Use yarn deploy:vercel only as a CLI escape hatch.`)
}

/**
 * Runs a git command in the monorepo root and returns trimmed stdout.
 *
 * @param args - Arguments after `git`.
 * @returns Trimmed stdout.
 * @throws Error When the process exits non-zero.
 */
function runGit(args: string[]): string {
  const result = spawnSync("git", args, {
    cwd: ROOT_DIR,
    encoding: "utf8",
  })
  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || "").trim()
    throw new Error(detail || `git ${args.join(" ")} failed`)
  }
  return (result.stdout ?? "").trim()
}

/**
 * Runs a yarn command in the monorepo root with inherited stdio.
 *
 * @param args - Arguments after `yarn`.
 * @returns Nothing.
 * @throws Error When the process exits non-zero.
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
 * Returns the current git branch, defaulting to `main` on failure.
 *
 * @returns Branch name.
 */
function getCurrentBranch(): string {
  try {
    return runGit(["branch", "--show-current"]) || "main"
  } catch {
    return "main"
  }
}

/**
 * Absolute paths of version-related files that exist on disk.
 *
 * @returns Paths for the root manifest, publishable manifests, and APP_VERSION.
 */
function collectVersionFilePaths(): string[] {
  return [
    PACKAGE_JSON_PATH,
    ...PUBLISHABLE_WORKSPACES.map((workspace) => join(ROOT_DIR, workspace, "package.json")),
    APP_VERSION_PATH,
  ]
}

/**
 * Reads file contents into a map keyed by absolute path (for rollback).
 *
 * @param paths - Absolute file paths to snapshot.
 * @returns Map of path → utf8 contents.
 */
function snapshotFiles(paths: string[]): Map<string, string> {
  const snapshot = new Map<string, string>()
  for (const absolute of paths) {
    snapshot.set(absolute, readFileSync(absolute, "utf8"))
  }
  return snapshot
}

/**
 * Restores files from a snapshot and unstages those relative paths.
 *
 * Side effects: writes files; runs `git restore --staged`.
 *
 * @param snapshot - Map from {@link snapshotFiles}.
 * @returns Nothing.
 */
function restoreFiles(snapshot: Map<string, string>): void {
  for (const [absolute, contents] of snapshot) {
    writeFileSync(absolute, contents)
  }
  const relativePaths = [...snapshot.keys()].map((absolute) => relative(ROOT_DIR, absolute))
  spawnSync("git", ["restore", "--staged", "--", ...relativePaths], { cwd: ROOT_DIR })
}

/**
 * Writes one canonical semver into the root manifest and every publishable
 * workspace manifest, then stamps SDK `APP_VERSION`.
 *
 * Side effects: writes the version files.
 *
 * @param version - New or synced version string. Padded patches are normalized.
 * @returns Absolute paths of files that were (or would be) updated.
 * @throws Error When `version` is unsupported (via {@link canonicalizeVersion}).
 */
function applyReleaseVersion(version: string): string[] {
  const canonical = canonicalizeVersion(version)
  for (const absolute of collectVersionFilePaths()) {
    if (absolute === APP_VERSION_PATH) {
      writeFileSync(absolute, formatAppVersionSource(canonical))
      continue
    }
    const source = readFileSync(absolute, "utf8")
    writeFileSync(absolute, setPackageVersionText(source, canonical))
  }
  return collectVersionFilePaths()
}

/**
 * Runs typecheck workspaces that gate a release.
 *
 * Side effects: spawns yarn with inherited stdio.
 *
 * @returns Nothing.
 * @throws Error When any typecheck fails.
 */
function runQualityGate(): void {
  console.log("Running release quality gate...")
  runYarn(["workspace", "@limetry/sdk", "typecheck"])
  runYarn(["workspace", "@limetry/preflight", "typecheck"])
  runYarn(["workspace", "@limetry/server", "typecheck"])
  runYarn(["workspace", "@limetry/web", "typecheck"])
  runYarn(["docs:check"])
}

/**
 * Deletes local tag `v{version}` if it exists (best-effort).
 *
 * @param version - Version without the `v` prefix.
 * @returns Nothing.
 */
function deleteLocalTag(version: string): void {
  const tag = `v${version}`
  const existing = spawnSync("git", ["tag", "-l", tag], {
    cwd: ROOT_DIR,
    encoding: "utf8",
  })
  if ((existing.stdout ?? "").trim() === tag) {
    spawnSync("git", ["tag", "-d", tag], { cwd: ROOT_DIR })
  }
}

/**
 * Rolls back a local release: soft-reset last commit, delete tag, restore files.
 *
 * @param version - Version that was tagged.
 * @param snapshot - Pre-release file snapshot.
 * @returns Nothing.
 */
function undoLocalRelease(version: string, snapshot: Map<string, string>): void {
  spawnSync("git", ["reset", "--mixed", "HEAD~1"], { cwd: ROOT_DIR })
  deleteLocalTag(version)
  restoreFiles(snapshot)
}

/**
 * Stages version files, commits `chore: released {version}`, and creates `v{version}`.
 *
 * @param version - New release version.
 * @param versionFiles - Absolute paths to stage.
 * @returns Nothing.
 * @throws Error When nothing staged, or the tag already exists.
 */
function commitAndTagRelease(version: string, versionFiles: string[]): void {
  console.log("Committing release files...")
  const relativePaths = versionFiles.map((absolute) => relative(ROOT_DIR, absolute))
  runGit(["add", "--", ...relativePaths])

  const staged = runGit(["status", "--porcelain", "--", ...relativePaths])
  if (!staged) {
    throw new Error("Release files did not change. Aborting commit.")
  }

  runGit(["commit", "-m", `chore: released ${version}`])

  const tag = `v${version}`
  const existingTag = runGit(["tag", "-l", tag])
  if (existingTag) {
    throw new Error(`Tag ${tag} already exists.`)
  }
  runGit(["tag", tag])
}

/**
 * Atomically pushes the release branch and single `v{version}` tag to origin.
 *
 * @param branch - Current stable branch name.
 * @param version - Version that was tagged.
 * @returns Nothing.
 * @throws Error When the push fails.
 */
function pushRelease(branch: string, version: string): void {
  console.log("Pushing commit and tag...")
  runGit(["push", "--atomic", "origin", branch, `v${version}`])
}

/**
 * Detects whether this module is the process entrypoint (CLI mode).
 *
 * @returns `true` when `import.meta.url` matches `process.argv[1]`.
 */
function isExecutedAsCli(): boolean {
  try {
    return resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1] ?? "")
  } catch {
    return false
  }
}

/**
 * Prompts for patch/minor/major bump selection.
 *
 * @param question - Readline question helper returning the raw answer.
 * @returns Selected {@link ReleaseBump}.
 * @throws Error When the choice is invalid.
 */
async function promptReleaseType(
  question: (query: string) => Promise<string>,
): Promise<ReleaseBump> {
  console.log("Select release type:")
  console.log("1. Patch (x.y.z+1)")
  console.log("2. Minor (x.y+1.0)")
  console.log("3. Major (x+1.0.0)")

  const choice = await question("Choice (1-3) [1]: ")
  const releaseType = releaseTypeFromChoice(choice)
  if (!releaseType) {
    throw new Error("Invalid choice")
  }
  return releaseType
}

/**
 * Prompts for AWS / Vercel / skip deploy selection.
 *
 * @param question - Readline question helper returning the raw answer.
 * @returns Selected {@link DeployTarget}.
 * @throws Error When the choice is invalid.
 */
async function promptDeployTarget(
  question: (query: string) => Promise<string>,
): Promise<DeployTarget> {
  console.log("Select deploy target:")
  console.log("1. AWS (Pulumi) [default]")
  console.log("2. Vercel")
  console.log("3. Skip deploy")

  const choice = await question("Choice (1-3) [1]: ")
  const deployTarget = deployTargetFromChoice(choice)
  if (!deployTarget) {
    throw new Error("Invalid deploy choice")
  }
  return deployTarget
}

/**
 * Runs `yarn deploy:infra` (Pulumi) for the AWS release path.
 *
 * @returns Nothing.
 * @throws Error When deploy fails.
 */
function runAwsDeploy(): void {
  console.log("")
  console.log("▶ AWS deploy (Pulumi)")
  console.log("   Running yarn deploy:infra → pulumi up --yes")
  runYarn(["deploy:infra"])
  console.log("✨ AWS deploy succeeded.")
}

/**
 * CLI entry: sync-only stamp, or full release + deploy flow.
 *
 * Side effects: git, yarn, file writes, optional Vercel watch; may set exit code.
 *
 * @returns Nothing.
 */
async function main(): Promise<void> {
  const args = parseReleaseCliArgs(process.argv.slice(2))
  if (args.help) {
    printHelp()
    process.exit(0)
  }

  const currentBranch = getCurrentBranch()
  const packageJson = JSON.parse(readFileSync(PACKAGE_JSON_PATH, "utf8")) as PackageJson
  const currentVersion = packageJson.version?.trim()
  if (!currentVersion) {
    throw new Error("package.json is missing version")
  }

  if (args.syncOnly) {
    const snapshot = snapshotFiles(collectVersionFilePaths())
    try {
      applyReleaseVersion(currentVersion)
      console.log(`Synced publishable package versions to ${canonicalizeVersion(currentVersion)}.`)
    } catch (error) {
      restoreFiles(snapshot)
      console.error(error instanceof Error ? error.message : error)
      process.exitCode = 1
    }
    return
  }

  if (!isStableReleaseBranch(currentBranch)) {
    console.error(`Release requires main or master (current: ${currentBranch}).`)
    process.exit(1)
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  const question = (query: string): Promise<string> =>
    new Promise((resolveQuestion) => {
      rl.question(query, resolveQuestion)
    })
  let readlineClosed = false
  const closeReadline = (): void => {
    if (!readlineClosed) {
      rl.close()
      readlineClosed = true
    }
  }

  try {
    try {
      const status = runGit(["status", "--porcelain"])
      if (status) {
        console.warn("You have uncommitted changes. Commit before releasing when possible.")
        if (!args.yes) {
          const proceed = await question("Proceed anyway? (Y/n): ")
          if (proceed.toLowerCase() === "n") {
            return
          }
        }
      }
    } catch {
      console.error("Git is required for yarn release.")
      process.exitCode = 1
      return
    }

    console.log(`Current version: ${currentVersion}`)
    console.log(`Current branch: ${currentBranch}`)

    const releaseType = args.bump ?? await promptReleaseType(question)
    const newVersion = computeNextVersion(currentVersion, releaseType)

    console.log(`New version: ${newVersion}`)
    if (!args.yes) {
      const confirm = await question("Confirm release? (Y/n): ")
      if (confirm.toLowerCase() === "n") {
        console.log("Release cancelled.")
        return
      }
    }

    const trackedPaths = collectVersionFilePaths()
    const snapshot = snapshotFiles(trackedPaths)
    let committed = false
    let pushed = false
    let versionFiles: string[] = trackedPaths
    const deployTarget = args.deploy
      ?? (args.yes ? "aws" : await promptDeployTarget(question))

    closeReadline()

    try {
      versionFiles = applyReleaseVersion(newVersion)
      console.log("Updated root and publishable package.json versions and APP_VERSION.")
      runQualityGate()
      commitAndTagRelease(newVersion, versionFiles)
      committed = true
      if (deployTarget === "aws") {
        runAwsDeploy()
        pushRelease(currentBranch, newVersion)
        pushed = true
        console.log("")
        console.log(`✨ Successfully released version ${newVersion}.`)
        console.log("🚀 Release tag pushed after successful AWS (Pulumi) deploy.")
      } else if (deployTarget === "vercel") {
        pushRelease(currentBranch, newVersion)
        pushed = true
        const sha = runGit(["rev-parse", "HEAD"])
        await watchVercelCommit({ sha })
        console.log("")
        console.log(`✨ Successfully released version ${newVersion}.`)
        console.log("🚀 GitHub→Vercel production deploys READY for this commit.")
      } else {
        console.log("⏭️  Skipping deploy.")
        pushRelease(currentBranch, newVersion)
        pushed = true
        console.log("")
        console.log(`✨ Successfully released version ${newVersion}.`)
        console.log("🚀 Tag pushed (deploy skipped).")
      }
    } catch (error) {
      if (committed && !pushed) {
        undoLocalRelease(newVersion, snapshot)
        console.error("Release rolled back locally (commit + tag removed; nothing pushed).")
      } else if (!committed) {
        restoreFiles(snapshot)
      } else {
        console.error(
          "Release commit/tag are on origin. Vercel (or a later step) failed — fix forward or revert.",
        )
      }
      console.error("❌ Release failed.")
      console.error(error instanceof Error ? error.message : error)
      process.exitCode = 1
      return
    }
  } finally {
    closeReadline()
  }
}

if (isExecutedAsCli()) {
  main().catch((error: unknown) => {
    console.error(error)
    process.exit(1)
  })
}

export {
  applyReleaseVersion,
  collectVersionFilePaths,
  VERSION_FILES,
}
