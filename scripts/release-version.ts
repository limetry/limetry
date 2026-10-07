/**
 * Pure helpers for limetry release versioning: parse/format semver
 * `x.y.z[-beta.N|-dev.branch.N]` strings, compute bumps, and parse
 * `yarn release` CLI flags.
 *
 * Used by `sync-version.ts` (interactive release) and unit tests. No I/O.
 */

/** Semver-style bump selected for a release. */
export type ReleaseBump = "patch" | "minor" | "major"

/** Post-release deploy destination, or skip deploy entirely. */
export type DeployTarget = "aws" | "vercel" | "skip"

/** Branch names treated as stable (production) release branches. */
export const STABLE_BRANCHES = new Set(["main", "master"])

/**
 * Workspace directories published to npm at the shared release version.
 * Publish order is dependency order in `.github/workflows/publish-npm.yml`,
 * not this list.
 */
export const PUBLISHABLE_WORKSPACES = [
  "packages/ci",
  "packages/cli",
  "packages/mcp",
  "packages/preflight",
  "packages/sdk",
  "packages/shopify",
  "packages/sql",
  "packages/ui",
] as const

/** Parsed components of a limetry version string. */
export type ParsedVersion = {
  /** Prerelease beta counter, or `null` for a stable version. */
  beta: number | null
  /** Abbreviated development branch slug for a dev build. */
  branch?: string
  /** Incrementing build number for a development branch. */
  branchIncrement?: number
  major: number
  minor: number
  /** Patch component, stored as an integer and formatted without leading zeros. */
  patch: number
}

/** Parsed argv for the release CLI (`yarn release` / `sync-version.ts`). */
export type ReleaseCliArgs = {
  /** Explicit bump from `--patch` / `--minor` / `--major`, else `null`. */
  bump: ReleaseBump | null
  /** Explicit deploy target from flags, else `null` (prompt or default). */
  deploy: DeployTarget | null
  /**
   * When set, skip version planning and only deploy this checkout.
   * Used by the sibling release so an already-tagged stack still gets Pulumi.
   */
  deployOnly: DeployTarget | null
  /** True when `--help` / `-h` was passed. */
  help: boolean
  /**
   * When true, this release also releases and deploys the sibling checkout.
   * `--no-peer` sets this false so the sibling does not call back.
   */
  peer: boolean
  /** True when `--sync-only` (re-stamp without bumping). */
  syncOnly: boolean
  /** True when a sibling orchestrator supplied the version to release. */
  adoptCurrent: boolean
  /** True when `--yes` / `-y` (non-interactive confirmations). */
  yes: boolean
  /**
   * Bump applied only to schemas whose content changed. Defaults to patch.
   */
  schemaBump: ReleaseBump
}

/**
 * Parses `x.y.z` versions with optional beta or branch development metadata.
 *
 * Leading zeros are accepted on input so older padded releases still parse.
 * {@link formatVersion} always emits canonical semver without them.
 *
 * @param version - Raw version string (whitespace trimmed).
 * @returns Parsed major/minor/patch and optional prerelease metadata.
 * @throws Error When the string does not match the supported format.
 */
export function parseVersion(version: string): ParsedVersion {
  const match = version.trim().match(
    /^(\d+)\.(\d+)\.(\d+)(?:-beta\.(\d+)|-dev\.([0-9a-z-]+)\.(\d+))?$/,
  )
  if (!match) {
    throw new Error(`Unsupported version format: ${version}`)
  }

  const parsed: ParsedVersion = {
    major: Number.parseInt(match[1], 10),
    minor: Number.parseInt(match[2], 10),
    patch: Number.parseInt(match[3], 10),
    beta: match[4] != null ? Number.parseInt(match[4], 10) : null,
  }
  if (match[5] != null && match[6] != null) {
    parsed.branch = match[5]
    parsed.branchIncrement = Number.parseInt(match[6], 10)
  }
  return parsed
}

/**
 * Formats a {@link ParsedVersion} as semver `x.y.z`, `x.y.z-beta.N`, or a
 * branch development version.
 *
 * @param version - Parsed version components.
 * @param prerelease - When true, appends the parsed prerelease metadata.
 * @returns Canonical semver string with no leading zeros.
 */
export function formatVersion(version: ParsedVersion, prerelease: boolean): string {
  const base = `${version.major}.${version.minor}.${version.patch}`
  if (!prerelease) {
    return base
  }
  if (version.branch != null && version.branchIncrement != null) {
    return `${base}-dev.${version.branch}.${version.branchIncrement}`
  }
  return `${base}-beta.${version.beta ?? 0}`
}

/**
 * Abbreviates a git branch into a valid, stable semver prerelease identifier.
 *
 * @param branch - Git branch name.
 * @returns Lowercase branch slug limited to 24 characters.
 */
export function abbreviateBranch(branch: string): string {
  const slug = branch
    .trim()
    .toLowerCase()
    .replace(/^(feature|bugfix|chore|fix|hotfix|release)[/-]+/, "")
    .replace(/[^0-9a-z]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24)
  return slug || "branch"
}

/**
 * Creates the next development version for a non-stable branch.
 *
 * The base version is supplied by normal release planning. Repeated releases
 * on the same branch retain that base and increment the branch build number.
 *
 * @param plannedVersion - Stable version selected by release planning.
 * @param currentVersion - Current package version.
 * @param branch - Git branch name.
 * @returns Incrementing branch development version.
 */
export function branchDevelopmentVersion(
  plannedVersion: string,
  currentVersion: string,
  branch: string,
): string {
  const slug = abbreviateBranch(branch)
  const current = parseVersion(currentVersion)
  const planned = parseVersion(plannedVersion)
  const sameBranch = current.branch === slug && current.branchIncrement != null
  const base = sameBranch
    ? current
    : planned
  const increment = sameBranch ? (current.branchIncrement ?? 0) + 1 : 1
  return formatVersion({
    major: base.major,
    minor: base.minor,
    patch: base.patch,
    beta: null,
    branch: slug,
    branchIncrement: increment,
  }, true)
}

/**
 * Normalizes a supported version string to canonical semver.
 *
 * @param version - Raw version string (padded patches are accepted).
 * @returns Semver string with no leading zeros.
 * @throws Error When `version` is unsupported (via {@link parseVersion}).
 */
export function canonicalizeVersion(version: string): string {
  const parsed = parseVersion(version)
  return formatVersion(parsed, parsed.beta != null || parsed.branch != null)
}

/**
 * Sets `version` in a package.json document without reformatting other fields.
 *
 * Inserts the field after `name` when it is missing. Padded versions are stored
 * as canonical semver.
 *
 * @param source - package.json text.
 * @param version - Version to write (padded patches are accepted).
 * @returns Updated package.json text.
 * @throws Error When `version` is unsupported or the result is not JSON.
 */
export function setPackageVersionText(source: string, version: string): string {
  const canonical = canonicalizeVersion(version)
  const parsed = JSON.parse(source) as { version?: unknown }
  if (parsed.version === canonical) {
    return source
  }

  const updated = typeof parsed.version === "string"
    ? source.replace(/("version"\s*:\s*")[^"]*(")/, `$1${canonical}$2`)
    : source.replace(/("name"\s*:\s*"[^"]*")/, `$1,\n  "version": "${canonical}"`)
  JSON.parse(updated)
  return updated
}

/**
 * Returns whether `branch` is a stable release branch (`main` / `master`).
 *
 * @param branch - Git branch name (whitespace trimmed).
 * @returns `true` if the branch is in {@link STABLE_BRANCHES}.
 */
export function isStableReleaseBranch(branch: string): boolean {
  return STABLE_BRANCHES.has(branch.trim())
}

/**
 * Computes the next version string from the current version and bump type.
 *
 * Prerelease path increments beta on patch, or resets beta to 0 on minor/major.
 * Stable path clears beta and bumps the selected component.
 *
 * @param currentVersion - Existing version string (must parse via {@link parseVersion}).
 * @param releaseType - Patch, minor, or major bump.
 * @param prerelease - When true, produce a `-beta.N` prerelease (default false).
 * @returns Next version string.
 * @throws Error When `currentVersion` is unsupported (via {@link parseVersion}).
 */
export function computeNextVersion(
  currentVersion: string,
  releaseType: ReleaseBump,
  prerelease = false,
): string {
  const parsed = parseVersion(currentVersion)

  if (prerelease) {
    if (releaseType === "patch") {
      if (parsed.beta != null) {
        return formatVersion({ ...parsed, beta: parsed.beta + 1 }, true)
      }
      return formatVersion({ ...parsed, patch: parsed.patch + 1, beta: 0 }, true)
    }
    if (releaseType === "minor") {
      return formatVersion({
        major: parsed.major,
        minor: parsed.minor + 1,
        patch: 0,
        beta: 0,
      }, true)
    }
    return formatVersion({
      major: parsed.major + 1,
      minor: 0,
      patch: 0,
      beta: 0,
    }, true)
  }

  if (releaseType === "patch") {
    return formatVersion({ ...parsed, patch: parsed.patch + 1, beta: null }, false)
  }
  if (releaseType === "minor") {
    return formatVersion({
      major: parsed.major,
      minor: parsed.minor + 1,
      patch: 0,
      beta: null,
    }, false)
  }
  return formatVersion({
    major: parsed.major + 1,
    minor: 0,
    patch: 0,
    beta: null,
  }, false)
}

/**
 * Compares two versions. Stable builds sort after prereleases of the same triple.
 *
 * @param left - Version string.
 * @param right - Version string.
 * @returns Negative when `left` is older, positive when newer, zero when equal.
 */
export function compareVersions(left: string, right: string): number {
  const a = parseVersion(left)
  const b = parseVersion(right)
  if (a.major !== b.major) return a.major - b.major
  if (a.minor !== b.minor) return a.minor - b.minor
  if (a.patch !== b.patch) return a.patch - b.patch
  const aPrerelease = a.beta != null || a.branch != null
  const bPrerelease = b.beta != null || b.branch != null
  if (!aPrerelease && !bPrerelease) return 0
  if (!aPrerelease) return 1
  if (!bPrerelease) return -1
  if (a.branch != null || b.branch != null) {
    if (a.branch !== b.branch) return (a.branch ?? "").localeCompare(b.branch ?? "")
    return (a.branchIncrement ?? 0) - (b.branchIncrement ?? 0)
  }
  return (a.beta ?? 0) - (b.beta ?? 0)
}

/**
 * How {@link planSharedRelease} chose the version both stacks should publish.
 */
export type SharedReleaseAction = "bump" | "adopt-peer" | "release-peer-first"

/**
 * What to do with the sibling checkout after this stack's own deploy.
 *
 * `release` runs the sibling's release script. `deploy-aws` only updates
 * Pulumi prod when that version is already tagged. `already-shipped` means
 * Vercel already deployed that tag.
 */
export type PeerFollowUp = "release" | "deploy-aws" | "already-shipped"

/**
 * Version both checkouts should publish on this release.
 */
export type SharedReleasePlan = {
  version: string
  bumped: boolean
  action: SharedReleaseAction
}

/**
 * Keeps both stacks on one product version.
 *
 * The first stack to release a version bumps. The other stack adopts that
 * version when its checkout is already there, or already ahead. A stack that
 * has tagged the current version waits until the other stack has tagged it too.
 *
 * @param input - Local and peer versions, whether each side has tagged its version, and the bump for a new release.
 * @returns Version to stamp, commit, and deploy.
 */
export function planSharedRelease(input: {
  localVersion: string
  peerVersion: string | null
  localTagged: boolean
  peerTagged: boolean
  bump: ReleaseBump
}): SharedReleasePlan {
  const local = canonicalizeVersion(input.localVersion)
  const peer = input.peerVersion ? canonicalizeVersion(input.peerVersion) : null

  if (peer) {
    const order = compareVersions(peer, local)
    if (order > 0) {
      return { version: peer, bumped: false, action: "adopt-peer" }
    }
    if (order < 0) {
      if (input.localTagged) {
        return { version: local, bumped: false, action: "release-peer-first" }
      }
      return { version: local, bumped: false, action: "adopt-peer" }
    }
    if (input.peerTagged && !input.localTagged) {
      return { version: local, bumped: false, action: "adopt-peer" }
    }
    if (input.localTagged && !input.peerTagged) {
      return { version: local, bumped: false, action: "release-peer-first" }
    }
  }

  return {
    version: computeNextVersion(local, input.bump),
    bumped: true,
    action: "bump",
  }
}

/**
 * Chooses how the sibling checkout is shipped with this release.
 *
 * An untagged sibling gets its own release. A sibling already tagged at this
 * version still receives a prod Pulumi update. Vercel already ran when that
 * tag was pushed.
 *
 * @param input - Whether the sibling tag exists, and the deploy target in use.
 * @returns Follow-up action for the sibling checkout.
 */
export function planPeerFollowUp(input: {
  peerTagged: boolean
  deploy: DeployTarget
}): PeerFollowUp {
  if (!input.peerTagged) {
    return "release"
  }
  if (input.deploy === "aws") {
    return "deploy-aws"
  }
  return "already-shipped"
}

/**
 * Maps an interactive menu choice to a {@link ReleaseBump}.
 *
 * @param choice - User input: `"1"` / `""` → patch, `"2"` → minor, `"3"` → major.
 * @returns Matching bump, or `null` for unrecognized input.
 */
export function releaseTypeFromChoice(choice: string): ReleaseBump | null {
  if (choice === "1" || choice === "") {
    return "patch"
  }
  if (choice === "2") {
    return "minor"
  }
  if (choice === "3") {
    return "major"
  }
  return null
}

/**
 * Maps an interactive menu choice (or keyword) to a {@link DeployTarget}.
 *
 * @param choice - Menu index or name (`aws` / `vercel` / `skip`); empty → aws.
 * @returns Matching deploy target, or `null` for unrecognized input.
 */
export function deployTargetFromChoice(choice: string): DeployTarget | null {
  const normalized = choice.trim().toLowerCase()
  if (normalized === "1" || normalized === "" || normalized === "aws") {
    return "aws"
  }
  if (normalized === "2" || normalized === "vercel") {
    return "vercel"
  }
  if (normalized === "3" || normalized === "skip" || normalized === "skip deploy") {
    return "skip"
  }
  return null
}

/**
 * Resolves `--deploy=…`, `--deploy …`, or shorthand `--aws` / `--vercel` /
 * `--skip-deploy` from argv.
 *
 * @param argv - CLI arguments (no node/script path).
 * @returns Deploy target when a flag is present, otherwise `null`.
 * @throws Error When `--deploy` is present with an invalid value.
 */
function parseDeployFlag(argv: string[]): DeployTarget | null {
  const deployEq = argv.find((arg) => arg.startsWith("--deploy="))
  if (deployEq) {
    const value = deployEq.slice("--deploy=".length).trim().toLowerCase()
    if (value === "aws" || value === "vercel" || value === "skip") {
      return value
    }
    throw new Error("Pass --deploy=aws, --deploy=vercel, or --deploy=skip.")
  }

  const deployIdx = argv.indexOf("--deploy")
  if (deployIdx >= 0) {
    const value = (argv[deployIdx + 1] ?? "").trim().toLowerCase()
    if (value === "aws" || value === "vercel" || value === "skip") {
      return value
    }
    throw new Error("Pass --deploy aws, --deploy vercel, or --deploy skip.")
  }

  if (argv.includes("--aws")) {
    return "aws"
  }
  if (argv.includes("--vercel")) {
    return "vercel"
  }
  if (argv.includes("--skip-deploy")) {
    return "skip"
  }
  return null
}

/**
 * Parses release CLI flags into a {@link ReleaseCliArgs} object.
 *
 * @param argv - CLI arguments (no node/script path).
 * @returns Parsed flags; `help: true` short-circuits other fields.
 * @throws Error When more than one of `--patch` / `--minor` / `--major` is set,
 *   or when `--deploy` has an invalid value.
 */
export function parseReleaseCliArgs(argv: string[]): ReleaseCliArgs {
  if (argv.includes("--help") || argv.includes("-h")) {
    return {
      bump: null,
      deploy: null,
      deployOnly: null,
      yes: false,
      syncOnly: false,
      adoptCurrent: false,
      help: true,
      peer: true,
      schemaBump: "patch",
    }
  }

  const yes = argv.includes("--yes") || argv.includes("-y")
  const syncOnly = argv.includes("--sync-only")
  const adoptCurrent = argv.includes("--adopt-current")
  const deploy = parseDeployFlag(argv)
  const deployOnly = parseDeployOnly(argv)
  const peer = !argv.includes("--no-peer")
  const bumpFlags = [
    argv.includes("--major") ? "major" : null,
    argv.includes("--minor") ? "minor" : null,
    argv.includes("--patch") ? "patch" : null,
  ].filter((value): value is ReleaseBump => value !== null)

  if (bumpFlags.length > 1) {
    throw new Error("Pass only one of --patch, --minor, or --major.")
  }

  return {
    bump: bumpFlags[0] ?? null,
    deploy,
    deployOnly,
    yes,
    syncOnly,
    adoptCurrent,
    help: false,
    peer,
    schemaBump: parseSchemaBump(argv),
  }
}

/**
 * Reads `--deploy-only=aws`, used when the sibling release only needs Pulumi.
 *
 * @param argv - CLI arguments.
 * @returns `aws` when the flag is present, otherwise `null`.
 * @throws Error When the flag value is not `aws`.
 */
function parseDeployOnly(argv: string[]): DeployTarget | null {
  const inline = argv.find((arg) => arg.startsWith("--deploy-only="))
  const spaced = argv.indexOf("--deploy-only")
  if (!inline && spaced < 0) {
    return null
  }
  const value = inline
    ? inline.slice("--deploy-only=".length).trim().toLowerCase()
    : (argv[spaced + 1] ?? "").trim().toLowerCase()
  if (value === "aws") {
    return "aws"
  }
  throw new Error("Pass --deploy-only=aws.")
}

/**
 * Reads `--schema-bump=patch|minor|major`.
 *
 * @param argv - CLI arguments.
 * @returns Schema bump, defaulting to patch.
 * @throws Error When the flag value is not a bump kind.
 */
function parseSchemaBump(argv: string[]): ReleaseBump {
  const flag = argv.find((arg) => arg.startsWith("--schema-bump="))
  if (!flag) {
    return "patch"
  }
  const value = flag.slice("--schema-bump=".length).trim().toLowerCase()
  if (value === "patch" || value === "minor" || value === "major") {
    return value
  }
  throw new Error("Pass --schema-bump=patch, --schema-bump=minor, or --schema-bump=major.")
}

/**
 * Builds the TypeScript source for `packages/sdk` `APP_VERSION` export.
 *
 * @param version - Version string to embed (must parse via {@link parseVersion}).
 * @returns File contents ending with a trailing newline.
 * @throws Error When `version` is unsupported (via {@link parseVersion}).
 */
export function formatAppVersionSource(version: string): string {
  return `export const APP_VERSION = "${canonicalizeVersion(version)}"\n`
}
