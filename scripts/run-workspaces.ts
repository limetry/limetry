/**
 * Parallel yarn workspace script runner with colored pass/fail summary.
 *
 * Lists workspaces via `yarn workspaces list --json`, filters by script presence
 * and optional `--include` / `--exclude` glob patterns, then runs
 * `yarn workspace <name> run <script>` with a CPU-bounded pool.
 *
 * Invoked as CLI (`tsx scripts/run-workspaces.ts <script> …`) or imported for tests.
 */

import { spawn, spawnSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { cpus } from "node:os"
import { join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { styleText } from "node:util"

/** Workspace entry from `yarn workspaces list --json`. */
export type WorkspaceRef = {
  /** Path relative to monorepo root. */
  location: string
  /** Package name (e.g. `@limetry/web`). */
  name: string
}

/** Outcome of one workspace script invocation. */
export type WorkspaceRunResult = {
  /** Wall-clock duration in milliseconds. */
  durationMs: number
  /** Workspace package name. */
  name: string
  /** Combined stdout+stderr (trimmed). */
  output: string
  /** Process exit status (`1` if null). */
  status: number
}

/** Options for {@link runWorkspaces}. */
export type RunWorkspacesOptions = {
  /** Max concurrent workspace runs (default: CPU count). */
  concurrency?: number
  /** Working directory for yarn (default: `process.cwd()`). */
  cwd?: string
  /** Glob patterns of workspace names to skip. */
  exclude?: string[]
  /** When set, only matching workspace names run. */
  include?: string[]
  /** package.json script name to execute in each workspace. */
  script: string
}

const ANSI = Boolean(process.stdout.isTTY) && process.env.NO_COLOR !== "1"

/**
 * Applies ANSI color when stdout is a TTY and `NO_COLOR` is unset.
 *
 * @param color - `styleText` color name.
 * @param text - Text to style.
 * @returns Styled or plain text.
 */
function paint(color: Parameters<typeof styleText>[0], text: string): string {
  return ANSI ? styleText(color, text) : text
}

/**
 * Formats a duration for the summary line.
 *
 * @param ms - Duration in milliseconds.
 * @returns Human-readable string (`Nms` or `N.NNs`).
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`
  }
  return `${(ms / 1000).toFixed(2)}s`
}

/**
 * Matches workspace names against simple glob patterns (`*` / `?`).
 *
 * @param name - Workspace package name.
 * @param pattern - Exact name or glob with `*` / `?`.
 * @returns Whether `name` matches `pattern`.
 */
export function matchesWorkspacePattern(name: string, pattern: string): boolean {
  if (!pattern.includes("*") && !pattern.includes("?")) {
    return name === pattern
  }
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*")
    .replace(/\?/g, ".")
  return new RegExp(`^${escaped}$`).test(name)
}

/**
 * Parses NDJSON from `yarn workspaces list --json` into workspace refs.
 *
 * @param stdout - Raw command stdout (one JSON object per line).
 * @returns Parsed workspace list (empty lines skipped).
 */
export function parseWorkspacesList(stdout: string): WorkspaceRef[] {
  return stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as WorkspaceRef)
}

/**
 * Collects values for a long flag (`--flag value` or `--flag=value`).
 *
 * @param argv - CLI arguments.
 * @param longFlag - Flag name including leading dashes (e.g. `--exclude`).
 * @returns Collected values and indexes consumed from `argv`.
 * @throws Error When `--flag` is present without a following value.
 */
function collectFlagValues(
  argv: string[],
  longFlag: string,
): { values: string[]; consumed: Set<number> } {
  const values: string[] = []
  const consumed = new Set<number>()
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === longFlag) {
      const value = argv[index + 1]
      if (!value) {
        throw new Error(`${longFlag} requires a workspace name or pattern`)
      }
      values.push(value)
      consumed.add(index)
      consumed.add(index + 1)
      index += 1
      continue
    }
    if (arg.startsWith(`${longFlag}=`)) {
      values.push(arg.slice(`${longFlag}=`.length))
      consumed.add(index)
    }
  }
  return { values, consumed }
}

/**
 * Parses CLI argv for the run-workspaces entrypoint.
 *
 * @param argv - Arguments after the script path.
 * @returns Script name (or `null`), include/exclude lists, and help flag.
 * @throws Error When `--include` / `--exclude` is missing its value.
 */
export function parseCliArgs(argv: string[]): {
  exclude: string[]
  help: boolean
  include: string[]
  script: string | null
} {
  if (argv.includes("--help") || argv.includes("-h") || argv.length === 0) {
    return { script: null, exclude: [], include: [], help: true }
  }

  const exclude = collectFlagValues(argv, "--exclude")
  const include = collectFlagValues(argv, "--include")
  const consumed = new Set([...exclude.consumed, ...include.consumed])
  const rest = argv.filter((_, index) => !consumed.has(index))

  return {
    script: rest[0] ?? null,
    exclude: exclude.values,
    include: include.values,
    help: false,
  }
}

/**
 * Lists yarn workspaces for `cwd` via `yarn workspaces list --json`.
 *
 * @param cwd - Monorepo root (or nested cwd where yarn resolves the workspace).
 * @returns Workspace refs.
 * @throws Error When the yarn command fails.
 */
function listWorkspaces(cwd: string): WorkspaceRef[] {
  const result = spawnSync("yarn", ["workspaces", "list", "--json"], {
    cwd,
    encoding: "utf8",
    env: process.env,
  })
  if ((result.status ?? 1) !== 0) {
    throw new Error((result.stderr || "yarn workspaces list failed").trim())
  }
  return parseWorkspacesList(result.stdout ?? "")
}

/**
 * Returns whether a workspace's package.json defines the given script.
 *
 * @param cwd - Monorepo root.
 * @param location - Workspace path relative to `cwd`.
 * @param script - Script key under `scripts`.
 * @returns `true` when the script exists; `false` on missing file or parse errors.
 */
function workspaceHasScript(cwd: string, location: string, script: string): boolean {
  const packageJsonPath = join(cwd, location, "package.json")
  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
      scripts?: Record<string, string>
    }
    return Boolean(packageJson.scripts?.[script])
  } catch {
    return false
  }
}

/**
 * Filters workspaces by include/exclude patterns and script presence.
 *
 * @param workspaces - Full workspace list.
 * @param input - cwd, script name, and include/exclude patterns.
 * @returns Workspaces that should run the script.
 */
export function selectWorkspaces(
  workspaces: WorkspaceRef[],
  input: { cwd: string; exclude: string[]; include?: string[]; script: string },
): WorkspaceRef[] {
  const excluded = input.exclude
  const included = input.include ?? []
  return workspaces.filter((workspace) => {
    if (excluded.some((pattern) => matchesWorkspacePattern(workspace.name, pattern))) {
      return false
    }
    if (
      included.length > 0
      && !included.some((pattern) => matchesWorkspacePattern(workspace.name, pattern))
    ) {
      return false
    }
    return workspaceHasScript(input.cwd, workspace.location, input.script)
  })
}

/**
 * Runs `yarn workspace <name> run <script>` and captures combined output.
 *
 * @param cwd - Monorepo root.
 * @param workspace - Target workspace.
 * @param script - Script name.
 * @returns Promise resolving to status, duration, and captured output.
 */
function runWorkspaceScript(
  cwd: string,
  workspace: WorkspaceRef,
  script: string,
): Promise<WorkspaceRunResult> {
  const started = Date.now()
  return new Promise((resolvePromise) => {
    const child = spawn("yarn", ["workspace", workspace.name, "run", script], {
      cwd,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    })
    let output = ""
    child.stdout.on("data", (chunk: Buffer) => {
      output += chunk.toString("utf8")
    })
    child.stderr.on("data", (chunk: Buffer) => {
      output += chunk.toString("utf8")
    })
    child.on("close", (code) => {
      resolvePromise({
        name: workspace.name,
        status: code ?? 1,
        durationMs: Date.now() - started,
        output: output.trim(),
      })
    })
  })
}

/**
 * Maps items with a fixed concurrency pool, preserving result order.
 *
 * @typeParam T - Input item type.
 * @typeParam R - Mapped result type.
 * @param items - Items to process.
 * @param concurrency - Max concurrent `mapper` calls.
 * @param mapper - Async transform for each item.
 * @returns Results in the same order as `items`.
 */
async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let nextIndex = 0

  async function worker(): Promise<void> {
    while (nextIndex < items.length) {
      const current = nextIndex
      nextIndex += 1
      results[current] = await mapper(items[current])
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, Math.max(items.length, 1)) },
    () => worker(),
  )
  await Promise.all(workers)
  return results
}

/**
 * Prints one pass/fail line for a workspace result.
 *
 * @param result - Completed workspace run.
 * @param nameWidth - Column width for name padding.
 * @returns Nothing.
 */
function printResultLine(result: WorkspaceRunResult, nameWidth: number): void {
  const padded = result.name.padEnd(nameWidth)
  const duration = paint("dim", formatDuration(result.durationMs))
  if (result.status === 0) {
    console.log(`  ${paint("green", "✅")} ${padded}  ${duration}`)
    return
  }
  console.log(`  ${paint("red", "❌")} ${padded}  ${duration}`)
}

/**
 * Runs a script across matching workspaces in parallel and prints a summary.
 *
 * Side effects: spawns yarn, writes to stdout/stderr.
 *
 * @param options - Script name and optional filters / concurrency.
 * @returns Exit code: `0` on all pass (or no targets), `1` if any failed.
 * @throws Error When listing workspaces fails.
 */
export async function runWorkspaces(options: RunWorkspacesOptions): Promise<number> {
  const cwd = options.cwd ?? process.cwd()
  const exclude = options.exclude ?? []
  const include = options.include ?? []
  const concurrency = options.concurrency ?? Math.max(1, cpus().length)

  const targets = selectWorkspaces(listWorkspaces(cwd), {
    cwd,
    exclude,
    include,
    script: options.script,
  })

  if (targets.length === 0) {
    console.log(paint("yellow", `⚠️  No workspaces with a "${options.script}" script.`))
    return 0
  }

  const nameWidth = Math.max(...targets.map((workspace) => workspace.name.length))
  const started = Date.now()

  console.log(
    `${paint("cyan", "▶")} ${paint("bold", options.script)}  ${paint("dim", `${targets.length} workspaces`)}\n`,
  )

  const results = await mapPool(targets, concurrency, async (workspace) => {
    const result = await runWorkspaceScript(cwd, workspace, options.script)
    printResultLine(result, nameWidth)
    return result
  })

  const failed = results.filter((result) => result.status !== 0)
  const passed = results.length - failed.length
  const elapsed = formatDuration(Date.now() - started)

  console.log("")
  if (failed.length === 0) {
    console.log(
      `${paint("green", "✨")} ${paint("bold", `${options.script} passed`)}  ${paint("dim", `${passed}/${results.length} · ${elapsed}`)}`,
    )
    return 0
  }

  for (const result of failed) {
    console.log(`\n${paint("red", "──")} ${paint("bold", result.name)}`)
    if (result.output) {
      console.log(result.output)
    } else {
      console.log(paint("dim", "(no output)"))
    }
  }

  console.log(
    `\n${paint("red", "❌")} ${paint("bold", `${options.script} failed`)}  ${paint("dim", `${passed} passed, ${failed.length} failed · ${elapsed}`)}`,
  )
  console.log(paint("dim", `   ${failed.map((result) => result.name).join(", ")}`))
  return 1
}

/**
 * Prints CLI usage to stdout.
 *
 * @returns Nothing.
 */
function printHelp(): void {
  console.log(`Usage:
  yarn typecheck
  yarn test
  yarn test:e2e
  tsx scripts/run-workspaces.ts <script> [--exclude <name>]... [--include <pattern>]...

Runs a workspace script in parallel and prints a colored pass/fail summary.
Successful workspace output is hidden; failures print the captured logs.`)
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
 * CLI entry: parse args, run workspaces, exit with status.
 *
 * @returns Nothing (exits the process).
 */
async function main(): Promise<void> {
  const args = parseCliArgs(process.argv.slice(2))
  if (args.help || !args.script) {
    printHelp()
    process.exit(args.help ? 0 : 1)
  }

  const exitCode = await runWorkspaces({
    script: args.script,
    exclude: args.exclude,
    include: args.include,
  })
  process.exit(exitCode)
}

if (isExecutedAsCli()) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
}
