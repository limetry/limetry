#!/usr/bin/env node

import { spawnSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { readWorkspaceVersions } from "./rewrite-workspace-protocol.mjs"

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const workspacePath = process.argv[2]

if (!workspacePath) {
  console.error("Usage: node scripts/wait-for-npm-dependencies.mjs <workspace-path>")
  process.exit(1)
}

const packageJson = JSON.parse(
  readFileSync(join(rootDir, workspacePath, "package.json"), "utf8"),
)
const workspaceVersions = readWorkspaceVersions(rootDir)
const dependencies = Object.entries(packageJson.dependencies ?? {})
  .filter(([name]) => name.startsWith("@limetry/"))

for (const [name, range] of dependencies) {
  if (typeof range !== "string") {
    throw new Error(`Invalid npm dependency range for ${name}.`)
  }

  let publishedRange = range
  if (range.startsWith("workspace:")) {
    const version = workspaceVersions.get(name)
    if (typeof version !== "string") {
      throw new Error(`Missing semver version for workspace dependency ${name}.`)
    }
    publishedRange = version
  }

  let published = false
  for (let attempt = 1; attempt <= 60; attempt += 1) {
    const result = spawnSync("npm", ["view", `${name}@${publishedRange}`, "version"], {
      encoding: "utf8",
      stdio: "ignore",
    })
    if (result.status === 0) {
      published = true
      console.log(`${name}@${publishedRange} is available on npm.`)
      break
    }

    if (attempt < 60) {
      console.log(`Waiting for ${name}@${publishedRange} on npm (attempt ${attempt}/60)...`)
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 10_000))
    }
  }

  if (!published) {
    throw new Error(`Timed out waiting for ${name}@${publishedRange} to be published on npm.`)
  }
}