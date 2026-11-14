/**
 * Invoke the global `releasekit` CLI when present on PATH.
 * Prefer soft mode for sync/status; require mode for release.
 */
import { spawnSync } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"

const INSTALL_HINT =
  "Install once from jeremydavidson/scripts/releasekit: yarn && yarn build && npm link. Later: npm i -g @jeremydavidson/releasekit"

export function findReleasekitBin(): string | null {
  const which = process.platform === "win32" ? "where" : "which"
  const result = spawnSync(which, ["releasekit"], { encoding: "utf8" })
  if (result.status !== 0) {
    return null
  }
  const line = (result.stdout ?? "").trim().split(/\r?\n/)[0]
  return line || null
}

export function runReleasekit(
  args: string[],
  mode: "soft" | "require" = "require",
): number {
  const bin = findReleasekitBin()
  if (!bin) {
    if (mode === "soft") {
      console.warn(`releasekit not on PATH; skipping. ${INSTALL_HINT}`)
      return 0
    }
    console.error(`releasekit not on PATH. ${INSTALL_HINT}`)
    return 1
  }

  const result = spawnSync(bin, args, { stdio: "inherit" })
  if (result.error) {
    console.error(result.error.message)
    return 1
  }
  return result.status ?? 1
}

function isExecutedAsCli(): boolean {
  try {
    return path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1] ?? "")
  } catch {
    return false
  }
}

if (isExecutedAsCli()) {
  const argv = process.argv.slice(2)
  const soft = argv.includes("--soft")
  const args = argv.filter((a) => a !== "--soft")
  process.exit(runReleasekit(args.length ? args : ["status"], soft ? "soft" : "require"))
}
