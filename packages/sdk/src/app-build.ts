/**
 * Platform version + deploy build counter from build-info.json.
 */

import buildInfo from "../build-info.json" with { type: "json" }

export type AppBuildInfo = {
  /** Platform semver without a leading `v`. */
  version: string
  /** Monotonic deploy/release build counter. */
  build: number
  /** Footer label, e.g. `v1.2.94 · 1847`. */
  label: string
}

/**
 * Returns platform version and build for footers / preflight.
 */
export function AppBuild(): AppBuildInfo {
  const version = typeof buildInfo.version === "string" ? buildInfo.version : "0.0.0"
  const build = typeof buildInfo.build === "number" ? buildInfo.build : 0
  return {
    version,
    build,
    label: `v${version} · ${build}`,
  }
}
