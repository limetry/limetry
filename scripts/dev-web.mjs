#!/usr/bin/env node
/**
 * Local limetry.org: Next web + public API (Ask Limetry / contact on :3815).
 *
 * Usage: yarn dev:web  (from repo root)
 *
 * Children are started in their own process groups so SIGINT/SIGTERM (and
 * Cursor/VS Code terminal kill) can tear down the whole yarn → tsx tree.
 */
import { spawn } from "node:child_process"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const children = []

/**
 * Spawns a yarn workspace script in a new process group and tracks it.
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
    // New process group → shutdown can signal the whole yarn/tsx subtree.
    detached: true,
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
 * Signals a child process group, then the child pid as fallback.
 *
 * @param child - Spawned child.
 * @param signal - POSIX signal name.
 */
function signalTree(child, signal) {
  if (child.pid == null) {
    return
  }
  try {
    process.kill(-child.pid, signal)
  } catch {
    try {
      child.kill(signal)
    } catch {
      // already gone
    }
  }
}

/**
 * Stops all child process groups and exits.
 *
 * @param code - Process exit code.
 */
function shutdown(code) {
  if (shuttingDown) {
    return
  }
  shuttingDown = true
  for (const child of children) {
    signalTree(child, "SIGTERM")
  }
  setTimeout(() => {
    for (const child of children) {
      signalTree(child, "SIGKILL")
    }
    process.exit(code)
  }, 400)
}

process.on("SIGINT", () => shutdown(0))
process.on("SIGTERM", () => shutdown(0))
process.on("SIGHUP", () => shutdown(0))

console.log("[dev-web] starting Limetry public API (:3815) + @limetry/web")
startWorkspace("@limetry/api", "dev", "api")
startWorkspace("@limetry/web", "dev", "web")
