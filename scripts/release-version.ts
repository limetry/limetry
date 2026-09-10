/**
 * Pure helpers for limetry release versioning: parse/format Driply-style
 * `x.y.zzz[-beta.N]` strings, compute bumps, and parse `yarn release` CLI flags.
 *
 * Used by `sync-version.ts` (interactive release) and unit tests. No I/O.
 */

/** Semver-style bump selected for a release. */
export type ReleaseBump = "patch" | "minor" | "major"

/** Post-release deploy destination, or skip deploy entirely. */
export type DeployTarget = "aws" | "vercel" | "skip"

/** Branch names treated as stable (production) release branches. */
export const STABLE_BRANCHES = new Set(["main", "master"])

/** Parsed components of a limetry version string. */
export type ParsedVersion = {
  /** Prerelease beta counter, or `null` for a stable version. */
  beta: number | null
  major: number
  minor: number
  /** Patch component (stored as integer; formatted zero-padded to 3 digits). */
  patch: number
}

/** Parsed argv for the release CLI (`yarn release` / `sync-version.ts`). */
export type ReleaseCliArgs = {
  /** Explicit bump from `--patch` / `--minor` / `--major`, else `null`. */
  bump: ReleaseBump | null
  /** Explicit deploy target from flags, else `null` (prompt or default). */
  deploy: DeployTarget | null
  /** True when `--help` / `-h` was passed. */
  help: boolean
  /** True when `--sync-only` (re-stamp without bumping). */
  syncOnly: boolean
  /** True when `--yes` / `-y` (non-interactive confirmations). */
  yes: boolean
}

/**
 * Parses `x.y.zzz` versions with optional `-beta.N` (Driply / Sprig style).
 *
 * @param version - Raw version string (whitespace trimmed).
 * @returns Parsed major/minor/patch and optional beta counter.
 * @throws Error When the string does not match the supported format.
 */
export function parseVersion(version: string): ParsedVersion {
  const match = version.trim().match(/^(\d+)\.(\d+)\.(\d+)(?:-beta\.(\d+))?$/)
  if (!match) {
    throw new Error(`Unsupported version format: ${version}`)
  }

  return {
    major: Number.parseInt(match[1], 10),
    minor: Number.parseInt(match[2], 10),
    patch: Number.parseInt(match[3], 10),
    beta: match[4] != null ? Number.parseInt(match[4], 10) : null,
  }
}

/**
 * Formats a {@link ParsedVersion} as `x.y.zzz` or `x.y.zzz-beta.N`.
 *
 * @param version - Parsed version components.
 * @param prerelease - When true, appends `-beta.{beta ?? 0}`.
 * @returns Canonical version string (patch zero-padded to 3 digits).
 */
export function formatVersion(version: ParsedVersion, prerelease: boolean): string {
  const patch = version.patch.toString().padStart(3, "0")
  const base = `${version.major}.${version.minor}.${patch}`
  if (!prerelease) {
    return base
  }
  return `${base}-beta.${version.beta ?? 0}`
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
    return { bump: null, deploy: null, yes: false, syncOnly: false, help: true }
  }

  const yes = argv.includes("--yes") || argv.includes("-y")
  const syncOnly = argv.includes("--sync-only")
  const deploy = parseDeployFlag(argv)
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
    yes,
    syncOnly,
    help: false,
  }
}

/**
 * Builds the TypeScript source for `packages/sdk` `APP_VERSION` export.
 *
 * @param version - Version string to embed (must parse via {@link parseVersion}).
 * @returns File contents ending with a trailing newline.
 * @throws Error When `version` is unsupported (via {@link parseVersion}).
 */
export function formatAppVersionSource(version: string): string {
  parseVersion(version)
  return `export const APP_VERSION = "${version}"\n`
}
