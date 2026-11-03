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
const landingPathMarker = /<!-- generated:api-paths -->[\s\S]*?<!-- \/generated:api-paths -->/
const httpMethods = new Set(["get", "post", "put", "patch", "delete", "options", "head"])

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
}

function isPublicOperation(operation) {
  return Boolean(
    operation
    && typeof operation === "object"
    && Array.isArray(operation.security)
    && operation.security.length === 0,
  )
}

function extractOpenApiPathRows(document) {
  const rows = []
  for (const [path, item] of Object.entries(document.paths ?? {})) {
    if (!item || typeof item !== "object") {
      continue
    }
    for (const [method, operation] of Object.entries(item)) {
      if (!httpMethods.has(method) || !operation || typeof operation !== "object") {
        continue
      }
      rows.push({
        auth: isPublicOperation(operation) ? "none" : "bearer",
        method: method.toUpperCase(),
        path,
        summary: typeof operation.summary === "string" && operation.summary.length > 0
          ? operation.summary
          : method.toUpperCase(),
      })
    }
  }
  return rows.sort((left, right) => {
    if (left.path === right.path) {
      return left.method < right.method ? -1 : left.method > right.method ? 1 : 0
    }
    return left.path < right.path ? -1 : 1
  })
}

function compareCatalogRows(left, right) {
  if (left.path === right.path) {
    return left.method < right.method ? -1 : left.method > right.method ? 1 : 0
  }
  return left.path < right.path ? -1 : 1
}

function renderPathRowsHtml(rows) {
  const catalogRows = [
    { method: "GET", path: "/", auth: "none", summary: "This landing page" },
    { method: "GET", path: "/openapi.yaml", auth: "none", summary: "OpenAPI YAML document" },
    { method: "GET", path: "/openapi.json", auth: "none", summary: "OpenAPI JSON document" },
    { method: "GET", path: "/openapi", auth: "none", summary: "Swagger UI" },
    ...rows,
  ].sort(compareCatalogRows)

  return catalogRows.map((row) => {
    const method = row.method
    const path = row.path
    const auth = row.auth === "none" ? "none" : "bearer · API key"
    const summary = row.summary
    return [
      "              <tr>",
      `                <td><span class="method">${escapeHtml(method)}</span> <code>${escapeHtml(path)}</code></td>`,
      `                <td>${escapeHtml(auth)}</td>`,
      `                <td>${escapeHtml(summary)}</td>`,
      "              </tr>",
    ].join("\n")
  }).join("\n")
}

mkdirSync(publicDir, { recursive: true })

const raw = readFileSync(openApiSource, "utf8")
const document = parseYaml(raw)
const landingPathRows = renderPathRowsHtml(extractOpenApiPathRows(document))
const landingPathTemplate = readFileSync(join(publicDir, "index.html"), "utf8")
if (!landingPathMarker.test(landingPathTemplate)) {
  throw new Error("Landing page is missing the generated API path markers")
}

copyFileSync(openApiSource, join(publicDir, "openapi.yaml"))
writeFileSync(join(publicDir, "openapi.json"), `${JSON.stringify(document, null, 2)}\n`)
writeFileSync(
  join(publicDir, "index.html"),
  landingPathTemplate.replace(
    landingPathMarker,
    `<!-- generated:api-paths -->\n${landingPathRows}\n              <!-- /generated:api-paths -->`,
  ),
)

console.log("Synced OpenAPI → packages/server/public/openapi.{yaml,json}")
