import { execFileSync } from "node:child_process"
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { stripManagedS3Objects } from "./strip-managed-s3-objects.mjs"

const stack = process.argv[2]
if (!stack) {
  console.error("Usage: node scripts/forget-s3-objects.mjs <stack>")
  process.exit(1)
}

const dir = mkdtempSync(join(tmpdir(), "pulumi-strip-"))
const exportedPath = join(dir, "export.json")
const strippedPath = join(dir, "stripped.json")
execFileSync("pulumi", ["stack", "export", "--stack", stack, "--file", exportedPath], {
  stdio: "inherit",
})
const result = stripManagedS3Objects(JSON.parse(readFileSync(exportedPath, "utf8")))
writeFileSync(strippedPath, `${JSON.stringify(result.deployment)}\n`)
console.error(`Dropped ${result.dropped} per-file S3 resources from stack ${stack}`)
if (result.dropped === 0) {
  process.exit(0)
}
execFileSync("pulumi", ["stack", "import", "--stack", stack, "--file", strippedPath, "--force"], {
  stdio: "inherit",
})
