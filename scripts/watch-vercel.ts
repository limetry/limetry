/**
 * Polls Vercel for GitHub-triggered production deployments of a commit SHA.
 *
 * Used after `yarn release:vercel` pushes to origin: waits until each OSS
 * (or supplied) project reaches READY, or fails / times out.
 *
 * CLI: `tsx scripts/watch-vercel.ts --sha <commitSha> [--timeout-ms 900000]`.
 * Requires `vercel` CLI auth; respects `VERCEL_SCOPE` / `VERCEL_ORG_ID`.
 */

import { spawnSync } from "node:child_process"
import { dirname, resolve } from "node:path"
import { setTimeout as delay } from "node:timers/promises"
import { fileURLToPath } from "node:url"

import { ossVercelTargets, type VercelTarget } from "./vercel-targets.js"

/** Subset of Vercel deployment JSON used for status polling. */
export type VercelDeployment = {
  name?: string
  ready?: number
  state?: string
  target?: string | null
  url: string
  meta?: {
    githubCommitSha?: string
  }
}

/** Parsed `vercel list --json` response. */
export type VercelListResponse = {
  deployments?: VercelDeployment[]
}

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const DEFAULT_TIMEOUT_MS = 15 * 60 * 1000
const POLL_MS = 5_000
const SUCCESS = new Set(["READY"])
const FAILURE = new Set(["ERROR", "CANCELED", "FAILED"])
const PENDING = new Set(["BUILDING", "QUEUED", "INITIALIZING", "UPLOADING"])

/**
 * Parses watch-vercel CLI flags.
 *
 * @param argv - Arguments after the script path.
 * @returns SHA (nullable), timeout, and help flag. Invalid timeout falls back to default.
 */
export function parseWatchArgs(argv: string[]): {
  help: boolean
  sha: string | null
  timeoutMs: number
} {
  if (argv.includes("--help") || argv.includes("-h")) {
    return { sha: null, timeoutMs: DEFAULT_TIMEOUT_MS, help: true }
  }
  let sha: string | null = null
  let timeoutMs = DEFAULT_TIMEOUT_MS
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === "--sha") {
      sha = argv[index + 1] ?? null
      index += 1
      continue
    }
    if (arg.startsWith("--sha=")) {
      sha = arg.slice("--sha=".length)
      continue
    }
    if (arg === "--timeout-ms") {
      timeoutMs = Number.parseInt(argv[index + 1] ?? "", 10)
      index += 1
      continue
    }
    if (arg.startsWith("--timeout-ms=")) {
      timeoutMs = Number.parseInt(arg.slice("--timeout-ms=".length), 10)
    }
  }
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    timeoutMs = DEFAULT_TIMEOUT_MS
  }
  return { sha, timeoutMs, help: false }
}

/**
 * Builds optional `--scope` args from env.
 *
 * @returns `["--scope", value]` or an empty array.
 */
function scopeArgs(): string[] {
  const scope = process.env.VERCEL_SCOPE ?? process.env.VERCEL_ORG_ID
  return scope ? ["--scope", scope] : []
}

/**
 * Lists recent deployments for a project filtered by GitHub commit SHA meta.
 *
 * Side effects: spawns `vercel list`.
 *
 * @param project - Vercel project name / id.
 * @param sha - Full or abbreviated commit SHA in `githubCommitSha` meta.
 * @returns Deployment list (may be empty while the webhook is pending).
 * @throws Error When `vercel list` fails or returns non-JSON.
 */
export function listDeploymentsForCommit(
  project: string,
  sha: string,
): VercelDeployment[] {
  const result = spawnSync("vercel", [
    "list",
    project,
    "--yes",
    "--json",
    "--limit",
    "20",
    "-m",
    `githubCommitSha=${sha}`,
    ...scopeArgs(),
  ], {
    cwd: ROOT_DIR,
    encoding: "utf8",
    env: {
      ...process.env,
      CI: process.env.CI ?? "1",
    },
  })
  if ((result.status ?? 1) !== 0) {
    const detail = (result.stderr || result.stdout || "").trim()
    throw new Error(detail || `vercel list ${project} failed`)
  }
  const parsed = JSON.parse(result.stdout || "{}") as VercelListResponse
  return parsed.deployments ?? []
}

/**
 * Prefers a production-targeted deployment, else the first list entry.
 *
 * @param deployments - Candidates from {@link listDeploymentsForCommit}.
 * @returns Selected deployment, or `null` when the list is empty.
 */
export function pickDeployment(
  deployments: VercelDeployment[],
): VercelDeployment | null {
  const production = deployments.find((deployment) => deployment.target === "production")
  return production ?? deployments[0] ?? null
}

/**
 * Returns whether a deployment state is a terminal success (`READY`).
 *
 * @param state - Raw Vercel state string.
 * @returns `true` when state is READY (case-insensitive).
 */
export function isTerminalSuccess(state: string | undefined): boolean {
  return SUCCESS.has((state ?? "").toUpperCase())
}

/**
 * Returns whether a deployment state is a terminal failure.
 *
 * @param state - Raw Vercel state string.
 * @returns `true` for ERROR / CANCELED / FAILED.
 */
export function isTerminalFailure(state: string | undefined): boolean {
  return FAILURE.has((state ?? "").toUpperCase())
}

/**
 * Returns whether a deployment is still in progress (or unknown empty state).
 *
 * @param state - Raw Vercel state string.
 * @returns `true` for pending build states or empty state.
 */
export function isPending(state: string | undefined): boolean {
  const normalized = (state ?? "").toUpperCase()
  return PENDING.has(normalized) || normalized === ""
}

/**
 * Blocks on `vercel inspect --wait` until the deployment finishes or times out.
 *
 * @param url - Deployment URL hostname (without scheme) as returned by list.
 * @param timeoutMs - Remaining budget converted to `--timeout=Ns`.
 * @returns Final deployment JSON from inspect.
 * @throws Error When inspect fails or exits non-zero.
 */
function inspectUntilComplete(url: string, timeoutMs: number): VercelDeployment {
  const result = spawnSync("vercel", [
    "inspect",
    url,
    "--wait",
    `--timeout=${Math.max(1, Math.ceil(timeoutMs / 1000))}s`,
    "--json",
    ...scopeArgs(),
  ], {
    cwd: ROOT_DIR,
    encoding: "utf8",
    env: {
      ...process.env,
      CI: process.env.CI ?? "1",
    },
  })
  if ((result.status ?? 1) !== 0) {
    const detail = (result.stderr || result.stdout || "").trim()
    throw new Error(detail || `vercel inspect ${url} failed`)
  }
  return JSON.parse(result.stdout || "{}") as VercelDeployment
}

/**
 * Polls until one production deployment for `sha` is READY on `target`.
 *
 * Side effects: console logs; spawns vercel list/inspect; sleeps between polls.
 *
 * @param target - Project to watch.
 * @param sha - Commit SHA to match in deployment meta.
 * @param timeoutMs - Overall deadline from start.
 * @returns READY deployment record.
 * @throws Error On terminal failure or timeout.
 */
async function waitForDeployment(
  target: VercelTarget,
  sha: string,
  timeoutMs: number,
): Promise<VercelDeployment> {
  const started = Date.now()
  console.log(`▶ Watching Vercel ${target.label} (${target.project}) for ${sha.slice(0, 7)}…`)

  while (Date.now() - started < timeoutMs) {
    const remaining = timeoutMs - (Date.now() - started)
    const deployment = pickDeployment(listDeploymentsForCommit(target.project, sha))
    if (!deployment) {
      console.log(`   …waiting for GitHub webhook deployment (${Math.round(remaining / 1000)}s left)`)
      await delay(POLL_MS)
      continue
    }

    const state = (deployment.state ?? "").toUpperCase()
    console.log(`   found https://${deployment.url} [${state || "UNKNOWN"}]`)

    if (isTerminalSuccess(state)) {
      return deployment
    }
    if (isTerminalFailure(state)) {
      throw new Error(
        `Vercel ${target.project} deployment failed (${state}): https://${deployment.url}`,
      )
    }

    const inspected = inspectUntilComplete(deployment.url, remaining)
    const finalState = (inspected.state ?? deployment.state ?? "").toUpperCase()
    if (isTerminalSuccess(finalState)) {
      return { ...deployment, ...inspected, state: finalState }
    }
    throw new Error(
      `Vercel ${target.project} deployment failed (${finalState || "UNKNOWN"}): https://${deployment.url}`,
    )
  }

  throw new Error(
    `Timed out waiting for Vercel ${target.project} deployment of ${sha}`,
  )
}

/**
 * Watches all configured Vercel targets until production deploys for `sha` are READY.
 *
 * @param input - Commit SHA, optional target list override, optional timeout.
 * @returns Nothing when all targets succeed.
 * @throws Error When any target fails or times out.
 */
export async function watchVercelCommit(input: {
  sha: string
  targets?: VercelTarget[]
  timeoutMs?: number
}): Promise<void> {
  const targets = input.targets ?? ossVercelTargets()
  const timeoutMs = input.timeoutMs ?? DEFAULT_TIMEOUT_MS
  console.log("")
  console.log("▶ Vercel GitHub webhook deploys")
  console.log(`   Waiting for production builds of ${input.sha}`)

  for (const target of targets) {
    const deployment = await waitForDeployment(target, input.sha, timeoutMs)
    console.log(
      `✨ ${target.label} READY  https://${deployment.url}`,
    )
  }
  console.log("✨ All watched Vercel production deploys succeeded.")
}

/**
 * Prints CLI usage to stdout.
 *
 * @returns Nothing.
 */
function printHelp(): void {
  console.log(`Usage:
  tsx scripts/watch-vercel.ts --sha <commitSha> [--timeout-ms 900000]

Polls Vercel for GitHub-triggered production deployments of the commit and
waits until each project is READY (or fails).`)
}

/**
 * Detects whether this module is the process entrypoint (CLI mode).
 *
 * @returns `true` when `import.meta.url` matches `process.argv[1]`.
 */
function isExecutedAsCli(): boolean {
  try {
    return resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1] ?? "")
  } catch {
    return false
  }
}

/**
 * CLI entry: require `--sha`, then {@link watchVercelCommit}.
 *
 * @returns Nothing (exits the process on help / missing sha).
 */
async function main(): Promise<void> {
  const args = parseWatchArgs(process.argv.slice(2))
  if (args.help || !args.sha) {
    printHelp()
    process.exit(args.help ? 0 : 1)
  }
  await watchVercelCommit({ sha: args.sha, timeoutMs: args.timeoutMs })
}

if (isExecutedAsCli()) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
}
