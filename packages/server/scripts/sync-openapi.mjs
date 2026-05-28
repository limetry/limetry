#!/usr/bin/env node
/**
 * Syncs packages/server/openapi.yaml into packages/server/public as YAML + JSON.
 *
 * Run via `yarn workspace @limetry/server sync:openapi`.
 */

import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { parse as parseYaml } from "yaml"

const __dirname = dirname(fileURLToPath(import.meta.url))
const serverRoot = join(__dirname, "..")
const openApiSource = join(serverRoot, "openapi.yaml")
const publicDir = join(serverRoot, "public")

mkdirSync(publicDir, { recursive: true })

const raw = readFileSync(openApiSource, "utf8")
const document = parseYaml(raw)

copyFileSync(openApiSource, join(publicDir, "openapi.yaml"))
writeFileSync(join(publicDir, "openapi.json"), `${JSON.stringify(document, null, 2)}\n`)

console.log("Synced OpenAPI → packages/server/public/openapi.{yaml,json}")
