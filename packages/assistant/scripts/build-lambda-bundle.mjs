#!/usr/bin/env node
/**
 * Bundles the Ask Limetry Lambda handler into packages/assistant/lambda-bundle.
 */
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import * as esbuild from "esbuild"

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageRoot = join(__dirname, "..")
const repoRoot = join(packageRoot, "../..")
const outDir = join(packageRoot, "lambda-bundle")
const productVersion = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8")).version
if (typeof productVersion !== "string" || !productVersion.trim()) {
  throw new Error("limetry/package.json is missing version")
}

rmSync(outDir, { recursive: true, force: true })
mkdirSync(outDir, { recursive: true })

await esbuild.build({
  entryPoints: [join(packageRoot, "src", "lambda.ts")],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  outfile: join(outDir, "lambda.js"),
  sourcemap: true,
  banner: {
    js: `var __LIMETRY_PRODUCT_VERSION__=${JSON.stringify(productVersion.trim())};var __import_meta_url=require("url").pathToFileURL(__filename).href;`,
  },
  define: {
    "import.meta.url": "__import_meta_url",
    __LIMETRY_PRODUCT_VERSION__: JSON.stringify(productVersion.trim()),
  },
  external: [
    "@aws-sdk/*",
  ],
  logLevel: "info",
})

const corpusSrc = join(repoRoot, "docs/assistant/corpus")
try {
  cpSync(corpusSrc, join(outDir, "docs/assistant/corpus"), { recursive: true })
} catch {
  console.warn("docs/assistant/corpus missing; run yarn workspace @limetry/assistant assistant:ingest")
}

writeFileSync(
  join(outDir, "package.json"),
  JSON.stringify(
    {
      name: "limetry-assistant-lambda",
      private: true,
      main: "lambda.js",
    },
    null,
    2,
  ),
)

writeFileSync(
  join(outDir, "README.md"),
  [
    "# Ask Limetry Lambda bundle",
    "",
    "Built by `yarn workspace @limetry/assistant build:lambda`.",
    "Deployed behind CloudFront `/api/chat*` on limetry.org.",
    "",
  ].join("\n"),
)

console.log(`Wrote ${outDir}`)
