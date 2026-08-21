/**
 * CLI escape hatch: production-deploy OSS Vercel projects without waiting on Git.
 *
 * Prefer `yarn release:vercel` (GitHub webhook + watch-vercel) for releases.
 * This script calls `vercel deploy --prod` for each `ossVercelTargets()` entry
 * using `VERCEL_SCOPE` / `VERCEL_ORG_ID` when set.
 *
 * Side effects: spawns `vercel` with inherited stdio; exits non-zero on failure.
 */

import { spawnSync } from "node:child_process"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { ossVercelTargets } from "./vercel-targets.js"

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..")

/**
 * Escape hatch: push a production deploy from the CLI without waiting on Git.
 * Prefer `yarn release:vercel` (GitHub webhook + watch) for releases.
 *
 * @param label - Human-readable target label for logs.
 * @param cwd - Relative project directory passed to `vercel --cwd`.
 * @param project - Vercel project name / id.
 * @returns Nothing.
 * @throws Error When `vercel deploy` exits non-zero.
 */
function deployTarget(label: string, cwd: string, project: string): void {
  const scope = process.env.VERCEL_SCOPE ?? process.env.VERCEL_ORG_ID
  const args = [
    "deploy",
    "--cwd",
    cwd,
    "--prod",
    "--yes",
    "--project",
    project,
  ]
  if (scope) {
    args.push("--scope", scope)
  }

  console.log("")
  console.log(`▶ Vercel ${label} (${project}) [CLI escape hatch]`)
  console.log(`   vercel ${args.join(" ")}`)

  const result = spawnSync("vercel", args, {
    cwd: ROOT_DIR,
    stdio: "inherit",
    env: {
      ...process.env,
      CI: process.env.CI ?? "1",
    },
  })
  if (result.status !== 0) {
    throw new Error(
      `Vercel deploy failed for ${project} (exit ${result.status ?? 1})`,
    )
  }
  console.log(`✨ Vercel ${label} deploy succeeded.`)
}

/**
 * Deploys every OSS Vercel target in sequence.
 *
 * @returns Nothing.
 * @throws Error When any target deploy fails.
 */
function main(): void {
  for (const target of ossVercelTargets()) {
    deployTarget(target.label, target.cwd, target.project)
  }
  console.log("")
  console.log("✨ All Vercel production deploys succeeded.")
}

try {
  main()
} catch (error: unknown) {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}
