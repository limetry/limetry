/**
 * Seeds local `vA.B.C-dev-Y` version env from git ahead-of-upstream count.
 */

import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { join } from "node:path"

import { isProductionRuntime, isTestEnv } from "./env-runtime.js"

const DEV_COMMIT_ENV_KEYS = [
  "LIMETRY_DEV_COMMITS",
  "NEXT_PUBLIC_LIMETRY_DEV_COMMITS",
  "EXPO_PUBLIC_LIMETRY_DEV_COMMITS",
] as const

const APP_VERSION_ENV_KEYS = [
  "LIMETRY_APP_VERSION",
  "NEXT_PUBLIC_LIMETRY_APP_VERSION",
  "EXPO_PUBLIC_LIMETRY_APP_VERSION",
] as const

/**
 * Counts commits on HEAD that are not on the upstream / origin tip.
 *
 * @param cwd - Git working tree (usually the stack repo root).
 * @returns Non-negative ahead count, or `0` when git is unavailable.
 */
export function countCommitsSincePush(cwd: string): number {
  const attempts: string[][] = [
    ["rev-list", "--count", "@{upstream}..HEAD"],
    ["rev-list", "--count", "@{u}..HEAD"],
    ["rev-list", "--count", "origin/HEAD..HEAD"],
    ["rev-list", "--count", "origin/main..HEAD"],
    ["rev-list", "--count", "origin/master..HEAD"],
  ]
  for (const args of attempts) {
    try {
      const out = execFileSync("git", args, {
        cwd,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim()
      if (/^\d+$/.test(out)) {
        return Number(out)
      }
    } catch {
      // try next strategy
    }
  }
  return 0
}

/**
 * Writes `LIMETRY_DEV_COMMITS` (+ Next/Expo public mirrors) for local AppVersion.
 *
 * No-ops in production/test so deploy builds keep `vA.B.C-X` from build-info.
 *
 * @param cwd - Git working tree used for the ahead count.
 * @param env - Env bag to mutate (defaults to `process.env`).
 * @returns The seeded commit count (0 when skipped).
 */
function readPackageVersion(cwd: string): string {
  try {
    const raw = readFileSync(join(cwd, "package.json"), "utf8")
    const parsed = JSON.parse(raw) as { version?: string }
    if (typeof parsed.version === "string" && parsed.version.trim()) {
      return parsed.version.trim()
    }
  } catch {
    // fall through
  }
  return "0.0.0"
}

export function seedDevVersionEnv(
  cwd: string,
  env: NodeJS.ProcessEnv = process.env,
): number {
  if (isProductionRuntime(env) || isTestEnv(env)) {
    return 0
  }

  const existing = env.LIMETRY_DEV_COMMITS
  const commits =
    existing && /^\d+$/.test(existing) ? Number(existing) : countCommitsSincePush(cwd)

  for (const key of DEV_COMMIT_ENV_KEYS) {
    env[key] = String(commits)
  }

  const label = `v${readPackageVersion(cwd)}-dev-${commits}`
  for (const key of APP_VERSION_ENV_KEYS) {
    env[key] = label
  }
  return commits
}
