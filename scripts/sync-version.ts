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
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join, relative, resolve } from "node:path"
import readline from "node:readline"
import { fileURLToPath } from "node:url"

import {
  canonicalizeVersion,
  type DeployTarget,
  deployTargetFromChoice,
  formatAppVersionSource,
  isStableReleaseBranch,
  parseReleaseCliArgs,
  planSharedRelease,
  PUBLISHABLE_WORKSPACES,
  type ReleaseBump,
  releaseTypeFromChoice,
  setPackageVersionText,
} from "./release-version.js"
import {
  buildCompatibility,
  publishCompatibility,
  type SchemaSpec,
  stampPeerProduct,
  syncSchemaFiles,
} from "./schema-versions.js"
import { watchVercelCommit } from "./watch-vercel.js"

/** Loose package.json shape used when reading/writing the root version. */
type PackageJson = {
  version?: string
  [key: string]: unknown
}

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const PACKAGE_JSON_PATH = join(ROOT_DIR, "package.json")
const APP_VERSION_PATH = join(ROOT_DIR, "packages/sdk/src/app-version.ts")
const CATALOG_PATH = join(ROOT_DIR, "versions/schemas.json")
const COMPATIBILITY_JSON = join(ROOT_DIR, "versions/compatibility.json")
const COMPATIBILITY_MODULE = join(ROOT_DIR, "packages/sdk/src/compatibility.ts")
const PEER_ROOT = join(ROOT_DIR, "..", "limetry-enterprise")
const PEER_NAME = "Limetry Cloud"

/** npm package names published at the shared product version. */
const PUBLISHED_PACKAGES = [
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
 * Schemas versioned independently of the product semver.
 */
const SCHEMA_SPECS: SchemaSpec[] = [
  {
    id: "openapi.evaluate",
    path: "packages/server/openapi.yaml",
    kind: "openapi-yaml",
    mirrors: [
      { path: "packages/server/public/openapi.yaml", kind: "openapi-yaml" },
      { path: "packages/server/public/openapi.json", kind: "openapi-json" },
    ],
  },
  {
    id: "openapi.custom-gpt",
    path: "examples/chatgpt-custom-gpt-payment-governance/openapi.json",
    kind: "openapi-json",
  },
  {
    id: "json.evaluate",
    path: "packages/server/src/schemas/action.ts",
    kind: "text",
    versionFile: "packages/server/src/schemas/schema-version.ts",
    versionConst: "JSON_SCHEMA_VERSION",
  },
]

/** Relative paths touched by a version stamp (for docs / tests). */
const VERSION_FILES = [
  "package.json",
  "packages/web/package.json",
  ...PUBLISHABLE_WORKSPACES.map((workspace) => `${workspace}/package.json`),
  "packages/sdk/src/app-version.ts",
  "versions/schemas.json",
  "versions/compatibility.json",
  "packages/sdk/src/compatibility.ts",
  "packages/web/public/compatibility.json",
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
  yarn sync-version            Re-stamp product versions from root (no product bump)
  yarn sync-version --schema-bump=minor
                               Use when a changed schema is not a patch

Bumps the root package.json, the website package, and every publishable
workspace package.json to the same semver, stamps packages/sdk APP_VERSION,
and writes versions/compatibility.json. Schemas stay on their own semver
starting at 1.0.0 and bump only when their contents change. When the Cloud
checkout is beside this repo, its product version is stamped to match. A
second release on the other stack deploys that same version.

Then the release runs a quality gate, commits, and tags locally. Pushing the
release tag triggers npm publishing for all public packages at the same
version. npm publish rewrites workspace: ranges while packing and restores
the manifests afterward.

AWS: runs Pulumi against the prod stack (limetry.org) before push, ignoring the
locally selected stack. Failed deploys roll back the local commit/tag.
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
  const schemaPaths = SCHEMA_SPECS.flatMap((spec) => [
    join(ROOT_DIR, spec.path),
    ...spec.versionFile ? [join(ROOT_DIR, spec.versionFile)] : [],
    ...(spec.mirrors ?? []).map((mirror) => join(ROOT_DIR, mirror.path)),
  ])
  return [
    PACKAGE_JSON_PATH,
    join(ROOT_DIR, "packages/web/package.json"),
    ...PUBLISHABLE_WORKSPACES.map((workspace) => join(ROOT_DIR, workspace, "package.json")),
    APP_VERSION_PATH,
    CATALOG_PATH,
    COMPATIBILITY_JSON,
    COMPATIBILITY_MODULE,
    join(ROOT_DIR, "packages/web/public/compatibility.json"),
    ...schemaPaths,
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
    if (!existsSync(absolute)) {
      continue
    }
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
 * @param schemaBump - Bump used only for schemas whose content changed.
 * @returns Absolute paths of files that participate in the release commit.
 * @throws Error When `version` is unsupported (via {@link canonicalizeVersion}).
 */
function applyReleaseVersion(version: string, schemaBump: ReleaseBump = "patch"): string[] {
  const canonical = canonicalizeVersion(version)
  const productPaths = [
    PACKAGE_JSON_PATH,
    join(ROOT_DIR, "packages/web/package.json"),
    ...PUBLISHABLE_WORKSPACES.map((workspace) => join(ROOT_DIR, workspace, "package.json")),
  ]
  for (const absolute of productPaths) {
    const source = readFileSync(absolute, "utf8")
    writeFileSync(absolute, setPackageVersionText(source, canonical))
  }
  writeFileSync(APP_VERSION_PATH, formatAppVersionSource(canonical))

  const schemas = syncSchemaFiles({
    rootDir: ROOT_DIR,
    catalogPath: CATALOG_PATH,
    specs: SCHEMA_SPECS,
    bump: schemaBump,
  })
  const document = buildCompatibility({
    product: canonical,
    packages: PUBLISHED_PACKAGES,
    websites: ["oss", "cloud"],
    schemas: schemas.catalog.schemas,
  })
  publishCompatibility({
    document,
    jsonPaths: [COMPATIBILITY_JSON, join(ROOT_DIR, "packages/web/public/compatibility.json")],
    modulePath: COMPATIBILITY_MODULE,
  })

  const peer = stampPeerProduct(PEER_ROOT, canonical, [
    { path: "package.json", kind: "package" },
    { path: "packages/web/package.json", kind: "package" },
    { path: "packages/portal/package.json", kind: "package" },
    { path: "packages/shared/src/app-version.ts", kind: "app-version" },
    { path: "packages/mobile/app.json", kind: "expo" },
  ])
  if (peer.length > 0) {
    console.log(`Stamped Cloud product files to ${canonical}. Commit that checkout to keep both stacks aligned.`)
  }
  console.log(schemas.catalog.schemas.map((record) => `${record.id}@${record.version}`).join(", "))
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
 * Reads a package.json version, or null when the file is missing.
 *
 * @param packageJsonPath - Absolute path to a package.json.
 * @returns Trimmed version string, or null.
 */
function readPackageVersion(packageJsonPath: string): string | null {
  if (!existsSync(packageJsonPath)) return null
  const parsed = JSON.parse(readFileSync(packageJsonPath, "utf8")) as PackageJson
  const version = parsed.version?.trim()
  return version || null
}

/**
 * Reports whether `v{version}` exists in a git checkout.
 *
 * @param cwd - Repository root.
 * @param version - Version without the `v` prefix.
 * @returns True when that tag is present.
 */
function gitHasTag(cwd: string, version: string): boolean {
  const tag = `v${canonicalizeVersion(version)}`
  const existing = spawnSync("git", ["tag", "-l", tag], {
    cwd,
    encoding: "utf8",
  })
  return (existing.stdout ?? "").trim() === tag
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
 * @param options - When `tagExistingCommit` is set, tag HEAD if the version files already match.
 * @returns Nothing.
 * @throws Error When nothing staged, or the tag already exists.
 */
function commitAndTagRelease(
  version: string,
  versionFiles: string[],
  options?: { tagExistingCommit?: boolean },
): void {
  console.log("Committing release files...")
  const relativePaths = versionFiles.map((absolute) => relative(ROOT_DIR, absolute))
  runGit(["add", "--", ...relativePaths])

  const staged = runGit(["status", "--porcelain", "--", ...relativePaths])
  if (!staged) {
    if (options?.tagExistingCommit) {
      const tag = `v${version}`
      const existingTag = runGit(["tag", "-l", tag])
      if (existingTag) {
        throw new Error(`Tag ${tag} already exists.`)
      }
      console.log(`Version files already match ${version}. Tagging the current commit.`)
      runGit(["tag", tag])
      return
    }
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
 * Pulumi stack that serves the public site (`limetry.org`).
 * Releases ignore whichever stack happens to be selected locally.
 */
const RELEASE_PULUMI_STACK = "prod"

/**
 * Runs the production Pulumi update for a release.
 *
 * @returns Nothing.
 * @throws Error When typecheck or `pulumi up` fails.
 */
function runAwsDeploy(): void {
  console.log("")
  console.log("▶ AWS deploy (Pulumi)")
  console.log(`   Running yarn typecheck:infra && pulumi up --yes --stack ${RELEASE_PULUMI_STACK}`)
  runYarn(["typecheck:infra"])
  const result = spawnSync("pulumi", ["up", "--yes", "--stack", RELEASE_PULUMI_STACK], {
    cwd: join(ROOT_DIR, "packages/infra"),
    stdio: "inherit",
    env: process.env,
  })
  if (result.status !== 0) {
    throw new Error(`pulumi up --stack ${RELEASE_PULUMI_STACK} failed (exit ${result.status ?? 1})`)
  }
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

    const peerVersion = readPackageVersion(join(PEER_ROOT, "package.json"))
    const localTagged = gitHasTag(ROOT_DIR, currentVersion)
    const peerTagged = peerVersion != null && gitHasTag(PEER_ROOT, peerVersion)
    let releaseType: ReleaseBump = args.bump ?? "patch"
    let plan = planSharedRelease({
      localVersion: currentVersion,
      peerVersion,
      localTagged,
      peerTagged,
      bump: releaseType,
    })
    if (plan.action === "release-peer-first") {
      console.error(
        `Version ${plan.version} is already released here. Release ${PEER_NAME} at ${plan.version} before starting a newer version.`,
      )
      return
    }
    if (plan.action === "bump" && !args.bump) {
      releaseType = await promptReleaseType(question)
      plan = planSharedRelease({
        localVersion: currentVersion,
        peerVersion,
        localTagged,
        peerTagged,
        bump: releaseType,
      })
    }
    const newVersion = plan.version

    if (plan.action === "adopt-peer") {
      console.log(`Using ${newVersion} already released on ${PEER_NAME}.`)
    } else {
      console.log(`New version: ${newVersion}`)
    }
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
      versionFiles = applyReleaseVersion(newVersion, args.schemaBump)
      console.log("Updated root and publishable package.json versions and APP_VERSION.")
      runQualityGate()
      commitAndTagRelease(newVersion, versionFiles, {
        tagExistingCommit: plan.action === "adopt-peer",
      })
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
