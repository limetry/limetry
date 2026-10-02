#!/usr/bin/env node

import { spawnSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import {
  includePublishDependencies,
  isPublishablePackage,
  packagePublishTag,
  PUBLISHABLE_PACKAGES,
  type PublishablePackage,
} from "./publish-targets.js"
import { isStableReleaseBranch, parseVersion } from "./release-version.js"

type RootPackageJson = {
  version?: string
}

type PublishRequest = {
  packages: PublishablePackage[]
  requestedPackages: PublishablePackage[]
  version: string
}

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const PACKAGE_JSON_PATH = resolve(ROOT_DIR, "package.json")

/**
 * Runs a git command and returns trimmed stdout.
 *
 * @param args - Arguments after `git`.
 * @returns Trimmed command output.
 * @throws If Git exits unsuccessfully.
 */
function runGit(args: string[]): string {
  const result = spawnSync("git", args, {
    cwd: ROOT_DIR,
    encoding: "utf8",
  })
  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || "").trim()
    throw new Error(detail || `git ${args.join(" ")} failed`)
  }
  return (result.stdout ?? "").trim()
}

/**
 * Resolves package arguments and validates the current release checkout.
 *
 * @returns Package keys and the root package version.
 * @throws If arguments, Git status, branch, or remote synchronization are invalid.
 */
function resolvePublishRequest(): PublishRequest {
  const requested = process.argv.slice(2)
  let requestedPackages: PublishablePackage[]
  if (requested.length === 1 && requested[0] === "all") {
    requestedPackages = [...PUBLISHABLE_PACKAGES]
  } else if (requested.length > 0 && requested.every(isPublishablePackage)) {
    requestedPackages = [...new Set(requested)]
  } else {
    throw new Error(`Choose one or more packages: ${PUBLISHABLE_PACKAGES.join(", ")}, or all.`)
  }

  const status = runGit(["status", "--porcelain"])
  if (status) {
    throw new Error("Publishing requires a clean working tree.")
  }

  const branch = runGit(["branch", "--show-current"])
  if (!isStableReleaseBranch(branch)) {
    throw new Error(`Publishing requires main or master (current: ${branch}).`)
  }

  const head = runGit(["rev-parse", "HEAD"])
  const remoteHead = runGit(["rev-parse", `origin/${branch}`])
  if (head !== remoteHead) {
    throw new Error(`Push ${branch} to origin before creating npm publish tags.`)
  }

  const rootPackage = JSON.parse(readFileSync(PACKAGE_JSON_PATH, "utf8")) as RootPackageJson
  const version = rootPackage.version?.trim()
  if (!version) {
    throw new Error("Root package.json is missing version.")
  }
  parseVersion(version)

  return {
    packages: includePublishDependencies(requestedPackages),
    requestedPackages,
    version,
  }
}

/**
 * Pushes package tags atomically to trigger their npm publish workflows.
 *
 * @returns Nothing.
 * @throws If a publish tag already exists or Git cannot push the tags.
 */
function main(): void {
  const { packages, requestedPackages, version } = resolvePublishRequest()
  const requested = new Set(requestedPackages)
  const tags: string[] = []

  for (const packageName of packages) {
    const tag = packagePublishTag(packageName, version)
    if (runGit(["ls-remote", "--tags", "origin", `refs/tags/${tag}`])) {
      if (requested.has(packageName)) {
        throw new Error(`Publish tag ${tag} already exists; npm versions cannot be republished.`)
      }
      console.log(`Dependency tag ${tag} already exists; not pushing it again.`)
      continue
    }
    tags.push(tag)
  }

  if (tags.length === 0) {
    throw new Error("All requested publish tags already exist; npm versions cannot be republished.")
  }

  console.log(`Triggering npm publish workflows for ${tags.join(", ")} @ ${version}...`)
  runGit([
    "push",
    "--atomic",
    "origin",
    ...tags.map((tag) => `HEAD:refs/tags/${tag}`),
  ])
  console.log("Publish workflow tags pushed. Follow their status in GitHub Actions.")
}

try {
  main()
} catch (error: unknown) {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}
