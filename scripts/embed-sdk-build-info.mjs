/**
 * Embeds repo-root build-info.json into the SDK as a generated TS module.
 *
 * Root `build-info.json` is the only committed source of truth. The generated
 * file is gitignored and compiled into `dist/` so published `@limetry/sdk`
 * does not need a second JSON copy on disk.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const sourcePath = join(root, "build-info.json")
const outPath = join(root, "packages/sdk/src/build-info.generated.ts")

if (!existsSync(sourcePath)) {
  console.error(`Missing ${sourcePath}`)
  process.exit(1)
}

const raw = readFileSync(sourcePath, "utf8")
const info = JSON.parse(raw)
const body = `/** Generated from ../../build-info.json — do not edit. */
const buildInfo = ${JSON.stringify(info, null, 2)} as const

export default buildInfo
`

writeFileSync(outPath, body)
console.log(`Embedded build-info into ${outPath}`)
