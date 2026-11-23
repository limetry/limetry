/**
 * Product version labels for CLIs, health, preflight, and website footers.
 *
 * - Package / CLI / health (release/prod): `vA.B.C`
 * - Website footers (release/prod): `vA.B.C-X` where X is repo-root `build-info.json` build
 * - AWS den stack: baked `LIMETRY_APP_VERSION` is `vA.B.C-beta.X` (or
 *   `vA.B.C-beta.N-X` when package version already includes `-beta.N`)
 * - Local development: `vA.B.C-dev-Y` where Y is commits since last push
 *   (`LIMETRY_DEV_COMMITS` / `NEXT_PUBLIC_*` / `EXPO_PUBLIC_*`, seeded by
 *   `@limetry/preflight` `seedDevVersionEnv`).
 *
 * Root `build-info.json` is the only committed SoT. `build-info.generated.ts`
 * is embedded at SDK build/align time so published `@limetry/sdk` carries the
 * same values without a second JSON file in git.
 */

import packageJson from "../package.json" with { type: "json" }
import buildInfo from "./build-info.generated.js"

/**
 * Bare product semver from package.json (e.g. `1.2.92`).
 *
 * Kept for published `@limetry/cli` / `@limetry/mcp` builds that still import
 * `APP_VERSION`. Prefer {@link AppVersion} in new code.
 *
 * @deprecated Use {@link AppVersion} (`v`-prefixed label) instead.
 */
export const APP_VERSION: string = packageJson.version

export type AppVersionChannel = "release" | "dev"

export type AppVersionInfo = {
  /** Platform semver without a leading `v`. */
  version: string
  /** Per-version deploy/release build counter from build-info.json. */
  build: number
  /** `dev` while running locally; `release` in production/test/deploy. */
  channel: AppVersionChannel
  /** Package/CLI/health label, e.g. `v1.2.94` or `v1.2.94-dev-3`. */
  label: string
  /** Website footer label, e.g. `v1.2.94-12` or `v1.2.94-dev-3`. */
  footerLabel: string
}

const DEV_COMMIT_ENV_KEYS = [
  "LIMETRY_DEV_COMMITS",
  "NEXT_PUBLIC_LIMETRY_DEV_COMMITS",
  "EXPO_PUBLIC_LIMETRY_DEV_COMMITS",
] as const

/**
 * Formats the package/CLI version label (no build in release channel).
 *
 * @param input - Version parts.
 * @returns Display label.
 */
export function formatAppVersionLabel(input: {
  version: string
  build: number
  channel: AppVersionChannel
  devCommits: number
}): string {
  if (input.channel === "dev") {
    return `v${input.version}-dev-${input.devCommits}`
  }
  return `v${input.version}`
}

/**
 * Formats the website footer version label (includes build in release channel).
 *
 * @param input - Version parts.
 * @returns Footer display label.
 */
export function formatAppFooterVersionLabel(input: {
  version: string
  build: number
  channel: AppVersionChannel
  devCommits: number
}): string {
  if (input.channel === "dev") {
    return `v${input.version}-dev-${input.devCommits}`
  }
  return `v${input.version}-${input.build}`
}

function readPlatformVersion(): string {
  if (typeof buildInfo.version === "string" && buildInfo.version.trim()) {
    return buildInfo.version.trim()
  }
  return packageJson.version
}

function readBuild(): number {
  return typeof buildInfo.build === "number" && Number.isFinite(buildInfo.build)
    ? buildInfo.build
    : 0
}

function isDevChannel(env: NodeJS.ProcessEnv): boolean {
  if (env.LIMETRY_FORCE_DEV_VERSION === "1") {
    return true
  }
  if (env.LIMETRY_ENV === "production" || env.LIMETRY_STATIC_EXPORT === "1") {
    return false
  }
  // Direct `process.env.NODE_ENV` so bundlers can inline; bag lookup alone is
  // empty in many browser builds.
  const nodeEnv = env.NODE_ENV
    || (typeof process !== "undefined" ? process.env?.NODE_ENV : undefined)
  if (nodeEnv === "production" || nodeEnv === "test") {
    return false
  }
  // Published npm CLIs/MCP run with unset NODE_ENV — that must be release.
  // Only explicit local/dev signals select the `-dev-Y` channel.
  if (nodeEnv === "development") {
    return true
  }
  for (const key of DEV_COMMIT_ENV_KEYS) {
    if (env[key] && /^\d+$/.test(env[key]!)) {
      return true
    }
  }
  return false
}

function readDevCommits(env: NodeJS.ProcessEnv): number {
  for (const key of DEV_COMMIT_ENV_KEYS) {
    const raw = env[key]
    if (raw && /^\d+$/.test(raw)) {
      return Number(raw)
    }
  }
  return 0
}

function readPublicAppVersionLabel(env: NodeJS.ProcessEnv): string | undefined {
  const candidates = [
    env.LIMETRY_APP_VERSION,
    env.NEXT_PUBLIC_LIMETRY_APP_VERSION,
    env.EXPO_PUBLIC_LIMETRY_APP_VERSION,
  ]
  for (const raw of candidates) {
    if (raw && raw.trim()) {
      return raw.trim()
    }
  }
  return undefined
}

function labelsForParts(input: {
  version: string
  build: number
  channel: AppVersionChannel
  devCommits: number
}): Pick<AppVersionInfo, "label" | "footerLabel"> {
  return {
    label: formatAppVersionLabel(input),
    footerLabel: formatAppFooterVersionLabel(input),
  }
}

/**
 * Resolves platform version + build/channel details for packages and footers.
 *
 * @param env - Optional env bag (defaults to `process.env`).
 * @returns Structured version info.
 */
export function resolveAppVersion(env: NodeJS.ProcessEnv = process.env): AppVersionInfo {
  const publicLabel = readPublicAppVersionLabel(env)
  if (publicLabel) {
    const legacyReleaseMatch = /^v([0-9]+(?:\.[0-9]+)*)-([0-9]+)$/.exec(publicLabel)
    if (legacyReleaseMatch) {
      const version = legacyReleaseMatch[1]!
      const build = Number(legacyReleaseMatch[2])
      return {
        version,
        build,
        channel: "release",
        ...labelsForParts({ version, build, channel: "release", devCommits: 0 }),
      }
    }
    const bareReleaseMatch = /^v([0-9]+(?:\.[0-9]+)*)$/.exec(publicLabel)
    if (bareReleaseMatch) {
      const version = bareReleaseMatch[1]!
      const build = readBuild()
      return {
        version,
        build,
        channel: "release",
        ...labelsForParts({ version, build, channel: "release", devCommits: 0 }),
      }
    }
    const devMatch = /^v([0-9]+(?:\.[0-9]+)*)-dev-([0-9]+)$/.exec(publicLabel)
    if (devMatch) {
      return {
        version: devMatch[1]!,
        build: readBuild(),
        channel: "dev",
        label: publicLabel,
        footerLabel: publicLabel,
      }
    }
    // AWS den bake: `vA.B.C-beta.X` or `vA.B.C-beta.N-X` (N from release:aws:dev).
    const betaWithBuildMatch =
      /^v(\d+\.\d+\.\d+-beta\.\d+)-(\d+)$/.exec(publicLabel)
    if (betaWithBuildMatch) {
      return {
        version: betaWithBuildMatch[1]!,
        build: Number(betaWithBuildMatch[2]),
        channel: "release",
        label: publicLabel,
        footerLabel: publicLabel,
      }
    }
    const betaBareBuildMatch = /^v(\d+\.\d+\.\d+)-beta\.(\d+)$/.exec(publicLabel)
    if (betaBareBuildMatch) {
      return {
        version: betaBareBuildMatch[1]!,
        build: Number(betaBareBuildMatch[2]),
        channel: "release",
        label: publicLabel,
        footerLabel: publicLabel,
      }
    }
    const betaMatch = /^v(\d+\.\d+\.\d+-beta\.\d+)$/.exec(publicLabel)
    if (betaMatch) {
      return {
        version: betaMatch[1]!,
        build: readBuild(),
        channel: "release",
        label: publicLabel,
        footerLabel: publicLabel,
      }
    }
    const channel: AppVersionChannel = isDevChannel(env) ? "dev" : "release"
    return {
      version: readPlatformVersion(),
      build: readBuild(),
      channel,
      label: publicLabel,
      footerLabel: publicLabel,
    }
  }

  const version = readPlatformVersion()
  const build = readBuild()
  const channel: AppVersionChannel = isDevChannel(env) ? "dev" : "release"
  const devCommits = channel === "dev" ? readDevCommits(env) : 0
  return {
    version,
    build,
    channel,
    ...labelsForParts({ version, build, channel, devCommits }),
  }
}

/**
 * Returns the package/CLI/health version label (`vA.B.C` or `vA.B.C-dev-Y`).
 *
 * @param env - Optional env bag (defaults to `process.env`).
 * @returns Version label string.
 */
export function AppVersion(env: NodeJS.ProcessEnv = process.env): string {
  return resolveAppVersion(env).label
}

/**
 * Returns the website footer version label (`vA.B.C-X` or `vA.B.C-dev-Y`).
 *
 * @param env - Optional env bag (defaults to `process.env`).
 * @returns Footer version label string.
 */
export function AppFooterVersion(env: NodeJS.ProcessEnv = process.env): string {
  return resolveAppVersion(env).footerLabel
}
