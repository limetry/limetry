import { spawnSync } from "node:child_process"
import { readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

const platformDirectory = resolve(import.meta.dirname, "../.sst/platform")
const packagePath = resolve(platformDirectory, "package.json")
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"))
const requiredProtobufVersion = "3.21.4"

packageJson.overrides ??= {}
packageJson.overrides["google-protobuf"] = requiredProtobufVersion
writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`)

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm"
const result = spawnSync(
  npmCommand,
  ["install", "--ignore-scripts", "--no-audit", "--no-fund"],
  {
    cwd: platformDirectory,
    stdio: "inherit",
  },
)

if (result.error) {
  throw result.error
}

if (result.status !== 0) {
  process.exit(result.status ?? 1)
}
