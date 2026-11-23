#!/usr/bin/env node
/**
 * Bundles the Limetry.org public API Lambda into packages/api/lambda-bundle.
 *
 * Ensures `docs/assistant/corpus` exists (runs assistant ingest when missing).
 */
import { spawnSync } from "node:child_process"
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import * as esbuild from "esbuild"

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageRoot = join(__dirname, "..")
const repoRoot = join(packageRoot, "../..")
const outDir = join(packageRoot, "lambda-bundle")
const corpusSrc = join(repoRoot, "docs/assistant/corpus")
const corpusJson = join(corpusSrc, "assistant-corpus.json")
const productVersion = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8")).version
if (typeof productVersion !== "string" || !productVersion.trim()) {
  throw new Error("limetry/package.json is missing version")
}

/**
 * Ensures the assistant corpus JSON exists, running ingest when needed.
 */
function ensureCorpus() {
  if (existsSync(corpusJson)) {
    return
  }
  console.log("docs/assistant/corpus missing; running assistant:ingest…")
  const result = spawnSync(
    "yarn",
    ["workspace", "@limetry/assistant", "assistant:ingest"],
    {
      cwd: repoRoot,
      stdio: "inherit",
      env: process.env,
    },
  )
  if (result.status !== 0) {
    throw new Error(
      "assistant:ingest failed; cannot package public API Lambda without a corpus",
    )
  }
  if (!existsSync(corpusJson)) {
    throw new Error(
      "docs/assistant/corpus/assistant-corpus.json still missing after ingest",
    )
  }
}

ensureCorpus()

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

cpSync(corpusSrc, join(outDir, "docs/assistant/corpus"), { recursive: true })

writeFileSync(
  join(outDir, "package.json"),
  JSON.stringify(
    {
      name: "limetry-api-lambda",
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
    "# Limetry.org public API Lambda bundle",
    "",
    "Built by `yarn workspace @limetry/api build:lambda`.",
    "Deployed behind CloudFront `/api*` on limetry.org (Ask Limetry + contact + health).",
    "",
  ].join("\n"),
)

console.log(`Wrote ${outDir}`)
