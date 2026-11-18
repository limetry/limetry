#!/usr/bin/env node
/**
 * Local limetry.org: Next web + Ask Limetry assistant (rewrite target :3815).
 *
 * Usage: yarn dev:web  (from repo root)
 */
import { spawn } from "node:child_process"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const children = []

/**
 * Spawns a yarn workspace script and tracks the child for shutdown.
 *
 * @param workspace - Yarn workspace name.
 * @param script - Package script name.
 * @param label - Log prefix.
 * @returns Child process.
 */
function startWorkspace(workspace, script, label) {
  const child = spawn("yarn", ["workspace", workspace, script], {
    cwd: root,
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
  })
  children.push(child)
  const prefix = `[${label}] `
  child.stdout?.on("data", (chunk) => {
    for (const line of String(chunk).split(/\r?\n/)) {
      if (line.length > 0) {
        process.stdout.write(`${prefix}${line}\n`)
      }
    }
  })
  child.stderr?.on("data", (chunk) => {
    for (const line of String(chunk).split(/\r?\n/)) {
      if (line.length > 0) {
        process.stderr.write(`${prefix}${line}\n`)
      }
    }
  })
  child.on("exit", (code, signal) => {
    if (shuttingDown) {
      return
    }
    console.error(
      `${prefix}exited (code=${code ?? "null"} signal=${signal ?? "null"}); stopping siblings`,
    )
    shutdown(code ?? 1)
  })
  return child
}

let shuttingDown = false

/**
 * Stops all child processes and exits.
 *
 * @param code - Process exit code.
 */
function shutdown(code) {
  if (shuttingDown) {
    return
  }
  shuttingDown = true
  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGTERM")
    }
  }
  setTimeout(() => process.exit(code), 250)
}

process.on("SIGINT", () => shutdown(0))
process.on("SIGTERM", () => shutdown(0))

console.log("[dev-web] starting Ask Limetry (:3815) + @limetry/web")
startWorkspace("@limetry/assistant", "dev", "assistant")
startWorkspace("@limetry/web", "dev", "web")
