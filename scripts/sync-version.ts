import { spawnSync } from "node:child_process"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join, relative, resolve } from "node:path"
import readline from "node:readline"
import { fileURLToPath } from "node:url"

import {
  computeNextVersion,
  type DeployTarget,
  deployTargetFromChoice,
  formatAppVersionSource,
  isStableReleaseBranch,
  parseReleaseCliArgs,
  parseVersion,
  type ReleaseBump,
  releaseTypeFromChoice,
} from "./release-version.js"

type PackageJson = {
  version?: string
  [key: string]: unknown
}

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const PACKAGE_JSON_PATH = join(ROOT_DIR, "package.json")
const APP_VERSION_PATH = join(ROOT_DIR, "packages/version/src/index.ts")
const README_PATH = join(ROOT_DIR, "README.md")

const VERSION_FILES = [
  "package.json",
  "packages/version/src/index.ts",
  "README.md",
]

function printHelp(): void {
  console.log(`Usage:
  yarn release                 Interactive production release (main/master)
  yarn release:aws             Release then deploy AWS (Pulumi), no deploy prompt
  yarn release:vercel          Release then deploy Vercel, no deploy prompt
  yarn release --patch --yes   Non-interactive patch release
  yarn release --minor --yes
  yarn release --major --yes
  yarn release --deploy=skip   Skip post-release deploy
  yarn sync-version            Re-stamp APP_VERSION + README from root (no bump)

Bumps the root package.json version only (workspace package.jsons stay
unversioned), stamps packages/version APP_VERSION and README, runs a quality
gate, then commits, tags, and pushes atomically. Failed steps restore version
files and do not leave a release commit or tag behind.

After a successful release, deploys to AWS by default (prompt: aws / vercel /
skip). Use yarn release:aws or yarn release:vercel to skip the prompt.`)
}

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

function runYarn(args: string[]): void {
  const result = spawnSync("yarn", args, {
    cwd: ROOT_DIR,
    encoding: "utf8",
    stdio: "inherit",
  })
  if (result.status !== 0) {
    throw new Error(`yarn ${args.join(" ")} failed`)
  }
}

function getCurrentBranch(): string {
  try {
    return runGit(["branch", "--show-current"]) || "main"
  } catch {
    return "main"
  }
}

function collectVersionFilePaths(): string[] {
  const paths = [PACKAGE_JSON_PATH, APP_VERSION_PATH]
  if (existsSync(README_PATH)) {
    paths.push(README_PATH)
  }
  return paths
}

function snapshotFiles(paths: string[]): Map<string, string> {
  const snapshot = new Map<string, string>()
  for (const absolute of paths) {
    snapshot.set(absolute, readFileSync(absolute, "utf8"))
  }
  return snapshot
}

function restoreFiles(snapshot: Map<string, string>): void {
  for (const [absolute, contents] of snapshot) {
    writeFileSync(absolute, contents)
  }
  const relativePaths = [...snapshot.keys()].map((absolute) => relative(ROOT_DIR, absolute))
  spawnSync("git", ["restore", "--staged", "--", ...relativePaths], { cwd: ROOT_DIR })
}

function stampReadmeVersion(version: string): void {
  if (!existsSync(README_PATH)) {
    return
  }
  const current = readFileSync(README_PATH, "utf8")
  const next = current.includes("<!-- APP_VERSION -->")
    ? current.replace(
      /<!-- APP_VERSION -->[\s\S]*?<!-- \/APP_VERSION -->/,
      `<!-- APP_VERSION -->**Version:** ${version}<!-- /APP_VERSION -->`,
    )
    : current.replace(
      /^(# Limetry\n)/,
      `$1\n<!-- APP_VERSION -->**Version:** ${version}<!-- /APP_VERSION -->\n`,
    )
  writeFileSync(README_PATH, next)
}

/**
 * Updates root package.json, APP_VERSION, and README. Workspace package.jsons
 * are intentionally left unversioned.
 */
function applyReleaseVersion(version: string): string[] {
  parseVersion(version)
  const packageJson = JSON.parse(readFileSync(PACKAGE_JSON_PATH, "utf8")) as PackageJson
  packageJson.version = version
  writeFileSync(PACKAGE_JSON_PATH, `${JSON.stringify(packageJson, null, 2)}\n`)
  writeFileSync(APP_VERSION_PATH, formatAppVersionSource(version))
  stampReadmeVersion(version)
  return collectVersionFilePaths()
}

function runQualityGate(): void {
  console.log("Running release quality gate...")
  runYarn(["workspace", "@limetry/version", "typecheck"])
  runYarn(["workspace", "@limetry/preflight", "typecheck"])
  runYarn(["workspace", "@limetry/server", "typecheck"])
  runYarn(["workspace", "@limetry/web", "typecheck"])
}

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

function undoLocalRelease(version: string, snapshot: Map<string, string>): void {
  spawnSync("git", ["reset", "--mixed", "HEAD~1"], { cwd: ROOT_DIR })
  deleteLocalTag(version)
  restoreFiles(snapshot)
}

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

function pushRelease(branch: string, version: string): void {
  console.log("Pushing commit and tag...")
  runGit(["push", "--atomic", "origin", branch, `v${version}`])
}

function isExecutedAsCli(): boolean {
  try {
    return resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1] ?? "")
  } catch {
    return false
  }
}

async function promptReleaseType(
  question: (query: string) => Promise<string>,
): Promise<ReleaseBump> {
  console.log("Select release type:")
  console.log("1. Patch (x.y.zzz+1)")
  console.log("2. Minor (x.y+1.000)")
  console.log("3. Major (x+1.0.000)")

  const choice = await question("Choice (1-3) [1]: ")
  const releaseType = releaseTypeFromChoice(choice)
  if (!releaseType) {
    throw new Error("Invalid choice")
  }
  return releaseType
}

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

function runDeploy(target: DeployTarget): void {
  if (target === "skip") {
    console.log("Skipping deploy.")
    return
  }
  if (target === "aws") {
    console.log("Deploying to AWS (Pulumi)...")
    runYarn(["deploy:infra"])
    return
  }
  console.log("Deploying to Vercel...")
  runYarn(["deploy:vercel"])
}

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
      console.log(`Synced APP_VERSION and README to ${currentVersion}.`)
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
    let versionFiles: string[] = trackedPaths

    try {
      versionFiles = applyReleaseVersion(newVersion)
      console.log("Updated root package.json, APP_VERSION, and README.")
      runQualityGate()
      commitAndTagRelease(newVersion, versionFiles)
      committed = true
      pushRelease(currentBranch, newVersion)
    } catch (error) {
      if (committed) {
        undoLocalRelease(newVersion, snapshot)
      } else {
        restoreFiles(snapshot)
      }
      console.error("Release failed. Version was not published.")
      console.error(error instanceof Error ? error.message : error)
      process.exitCode = 1
      return
    }

    console.log(`Successfully released version ${newVersion}.`)

    const deployTarget = args.deploy
      ?? (args.yes ? "aws" : await promptDeployTarget(question))
    try {
      runDeploy(deployTarget)
    } catch (error) {
      console.error("Release succeeded, but deploy failed.")
      console.error(error instanceof Error ? error.message : error)
      process.exitCode = 1
    }
  } finally {
    rl.close()
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
