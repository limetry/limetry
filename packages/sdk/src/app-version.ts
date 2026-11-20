/**
 * Product version label for CLIs, footers, health, and preflight.
 *
 * - Deploy / production: `vA.B.C-X` where X is repo-root `build-info.json` build.
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
  /** Monotonic deploy/release build counter from build-info.json. */
  build: number
  /** `dev` while running locally; `release` in production/test/deploy. */
  channel: AppVersionChannel
  /** Display label, e.g. `v1.2.94-12` or `v1.2.94-dev-3`. */
  label: string
}

const DEV_COMMIT_ENV_KEYS = [
  "LIMETRY_DEV_COMMITS",
  "NEXT_PUBLIC_LIMETRY_DEV_COMMITS",
  "EXPO_PUBLIC_LIMETRY_DEV_COMMITS",
] as const

/**
 * Formats a version label from resolved version/build/channel inputs.
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
  if (env.LIMETRY_ENV === "production") {
    return false
  }
  if (env.NODE_ENV === "production" || env.NODE_ENV === "test") {
    return false
  }
  return true
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

/**
 * Resolves platform version + build/channel details for footers and health.
 *
 * @param env - Optional env bag (defaults to `process.env`).
 * @returns Structured version info.
 */
export function resolveAppVersion(env: NodeJS.ProcessEnv = process.env): AppVersionInfo {
  const version = readPlatformVersion()
  const build = readBuild()
  const channel: AppVersionChannel = isDevChannel(env) ? "dev" : "release"
  const devCommits = channel === "dev" ? readDevCommits(env) : 0
  return {
    version,
    build,
    channel,
    label: formatAppVersionLabel({ version, build, channel, devCommits }),
  }
}

/**
 * Returns the display version label (`vA.B.C-X` or `vA.B.C-dev-Y`).
 *
 * @param env - Optional env bag (defaults to `process.env`).
 * @returns Version label string.
 */
export function AppVersion(env: NodeJS.ProcessEnv = process.env): string {
  return resolveAppVersion(env).label
}
