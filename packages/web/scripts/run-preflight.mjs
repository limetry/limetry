import { spawnSync } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const entry = path.join(webRoot, "scripts/run-preflight-entry.ts")
const tsxCli = path.resolve(webRoot, "../../node_modules/tsx/dist/cli.mjs")

const result = spawnSync(
  process.execPath,
  [tsxCli, entry],
  {
    cwd: webRoot,
    env: process.env,
    stdio: "inherit",
  },
)

if ((result.status ?? 1) !== 0) {
  process.exit(result.status ?? 1)
}
