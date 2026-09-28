#!/usr/bin/env node
import { spawn } from "node:child_process"
import { EventEmitter } from "node:events"
import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath } from "node:url"

EventEmitter.defaultMaxListeners = 30

const require = createRequire(import.meta.url)
const packageDir = path.dirname(fileURLToPath(import.meta.url))
const appDir = path.join(packageDir, "..")

const preferredEnvKey = process.env.LIMETRY_DEV_PORT_ENV || "WEB_PORT"
const preferredDefault = Number(process.env.LIMETRY_DEV_PORT_DEFAULT || "3800")
const nextArgs = process.argv.slice(2)

async function main() {
  const { isProductionRuntime, isTestEnv, resolveDevListenPort } = await import(
    "@limetry/preflight"
  )

  const preferredRaw = process.env[preferredEnvKey] || process.env.PORT
  const preferred = preferredRaw ? Number(preferredRaw) : preferredDefault
  if (!Number.isInteger(preferred) || preferred <= 0) {
    throw new Error(`Invalid preferred port from ${preferredEnvKey}/PORT: ${preferredRaw}`)
  }

  const hop = await resolveDevListenPort(preferred, {
    enabled: !isTestEnv(process.env) && !isProductionRuntime(process.env),
  })

  if (hop.changed) {
    console.warn(
      `[dev] Port ${hop.preferred} is in use; starting on ${hop.port}`,
    )
  }

  process.env.PORT = String(hop.port)
  process.env[preferredEnvKey] = String(hop.port)

  const nextBin = require.resolve("next/dist/bin/next")
  const child = spawn(process.execPath, [nextBin, ...nextArgs, "-p", String(hop.port)], {
    cwd: appDir,
    stdio: "inherit",
    env: process.env,
  })

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal)
      return
    }
    process.exit(code ?? 1)
  })
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
