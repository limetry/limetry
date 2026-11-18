#!/usr/bin/env node
/**
 * Builds docs/assistant/corpus/assistant-corpus.json from Limetry markdown sources.
 *
 * Usage (from repo root or packages/server):
 *   yarn workspace @limetry/server assistant:ingest
 *
 * Optional Cloud/enterprise docs:
 *   LIMETRY_ASSISTANT_EXTRA_ROOTS=../limetry-enterprise yarn workspace @limetry/server assistant:ingest
 */

import { createHash } from "node:crypto"
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs"
import { dirname, join, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const serverRoot = resolve(here, "..")
const repoRoot = resolve(serverRoot, "../..")
const outDir = resolve(repoRoot, "docs/assistant/corpus")
const outFile = join(outDir, "assistant-corpus.json")

const LOCAL_EMBED_DIM = 256

const ENTERPRISE_DOC_FILES = [
  "README.md",
  "docs/GOLDEN_PATH.md",
  "docs/SSO_AND_IDENTITY.md",
  "docs/DEPLOYMENT_AND_DR.md",
  "docs/FREE_PLAN_CERTIFICATION.md",
  "docs/STAGING_FREE_PLAN.md",
]

function flattenMarkdownTables(text) {
  return text.replace(
    /(?:^\|.+\|[ \t]*\n)+/gm,
    (block) => {
      const cells = block
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.startsWith("|") && !/^\|[\s|:-]+$/.test(line))
        .map((line) => line
          .replace(/^\||\|$/g, "")
          .split("|")
          .map((cell) => cell.trim())
          .filter(Boolean)
          .join(" — "))
      return `${cells.join(". ")}\n`
    },
  )
}

function flattenCallouts(text) {
  return text
    .replace(/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/gim, "")
    .replace(/^>\s?/gm, "")
}

function stripMdx(raw) {
  return flattenCallouts(
    flattenMarkdownTables(
      raw
        .replace(/^---[\s\S]*?---\s*/m, "")
        .replace(/```[\s\S]*?```/g, (block) => block.replace(/```\w*/g, "").trim())
        .replace(/import\s+.+from\s+["'].+["'];?/g, "")
        .replace(/export\s+(const|let|function|default)[\s\S]*?(?=\n#{1,6}\s|\n\n|$)/g, "")
        .replace(/<\/?[A-Za-z][^>]*>/g, " ")
        .replace(/\{[^}]+\}/g, " ")
        .replace(/\n{3,}/g, "\n\n"),
    ),
  ).trim()
}

function snapBoundary(text, index, direction) {
  if (index <= 0) return 0
  if (index >= text.length) return text.length
  if (/\s/.test(text[index] ?? "") || /\s/.test(text[index - 1] ?? "")) return index
  if (direction === "end") {
    const next = text.indexOf(" ", index)
    const nextNl = text.indexOf("\n", index)
    const candidates = [next, nextNl].filter((value) => value >= 0)
    if (candidates.length === 0) return text.length
    return Math.min(...candidates)
  }
  const prevSpace = text.lastIndexOf(" ", index)
  const prevNl = text.lastIndexOf("\n", index)
  const boundary = Math.max(prevSpace, prevNl)
  return boundary >= 0 ? boundary + 1 : 0
}

function windowChunks(text, chunkSize, overlap) {
  if (text.length <= chunkSize) return [text]
  const chunks = []
  let start = 0
  while (start < text.length) {
    let end = Math.min(text.length, start + chunkSize)
    end = snapBoundary(text, end, "end")
    if (end <= start) end = Math.min(text.length, start + chunkSize)
    const slice = text.slice(start, end).trim()
    if (slice) chunks.push(slice)
    if (end >= text.length) break
    const previousStart = start
    const nextStart = Math.max(0, end - overlap)
    let snappedStart = snapBoundary(text, nextStart, "start")
    // Long tokens can stall snapBoundary("start") at 0; always advance.
    if (snappedStart <= previousStart) {
      snappedStart = nextStart > previousStart ? nextStart : end
    }
    start = snappedStart >= end ? end : snappedStart
    if (start <= previousStart) start = end
    if (start >= text.length) break
  }
  return chunks
}

function chunkText(text, chunkSize = 1_200, overlap = 200) {
  const cleaned = text.replace(/\r\n/g, "\n").trim()
  if (!cleaned) return []
  if (cleaned.length <= chunkSize) return [cleaned]
  const headingSplits = cleaned.split(/(?=^#{1,3}\s)/m).map((part) => part.trim()).filter(Boolean)
  if (headingSplits.length > 1) {
    const merged = []
    let buffer = ""
    for (const part of headingSplits) {
      if (!buffer) {
        buffer = part
        continue
      }
      if (`${buffer}\n\n${part}`.length <= chunkSize) {
        buffer = `${buffer}\n\n${part}`
        continue
      }
      merged.push(...windowChunks(buffer, chunkSize, overlap))
      buffer = part
    }
    if (buffer) merged.push(...windowChunks(buffer, chunkSize, overlap))
    return merged.filter(Boolean)
  }
  return windowChunks(cleaned, chunkSize, overlap)
}

function titleFromDoc(sourcePath, text) {
  const heading = text.match(/^#\s+(.+)$/m)
  if (heading?.[1]) return heading[1].trim().replace(/`/g, "")
  const base = sourcePath.split("/").pop() ?? sourcePath
  return base.replace(/\.(mdx?|ya?ml|json)$/i, "")
}

function sourcePriority(sourcePath) {
  const normalized = sourcePath.replace(/\\/g, "/")
  if (normalized.startsWith("packages/web/content/docs/")) return 3
  if (
    normalized === "README.md"
    || normalized === "INSTALL.md"
    || normalized === "USAGE.md"
    || normalized === "SECURITY.md"
  ) {
    return 2
  }
  if (normalized.startsWith("docs/") && !normalized.startsWith("docs/api/")) return 2
  if (/\/README\.md$/i.test(normalized)) return 1
  return 0
}

function localHashEmbedding(text) {
  const vector = new Array(LOCAL_EMBED_DIM).fill(0)
  const tokens = text.toLowerCase().split(/[^a-z0-9_./+-]+/).filter(Boolean)
  for (const token of tokens) {
    const digest = createHash("sha256").update(token).digest()
    const index = digest.readUInt16BE(0) % LOCAL_EMBED_DIM
    const sign = digest[2] & 1 ? 1 : -1
    vector[index] += sign
  }
  let sum = 0
  for (const value of vector) sum += value * value
  if (sum === 0) return vector
  const norm = Math.sqrt(sum)
  return vector.map((value) => value / norm)
}

function walk(dir, predicate, acc = []) {
  if (!existsSync(dir)) return acc
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === "dist" || entry === ".git" || entry === "docs/api") continue
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) {
      if (full.endsWith(`${join("docs", "api")}`) || full.includes(`${join("docs", "api")}`)) continue
      walk(full, predicate, acc)
    } else if (predicate(full)) {
      acc.push(full)
    }
  }
  return acc
}

function resolveExtraRoots() {
  const raw = process.env.LIMETRY_ASSISTANT_EXTRA_ROOTS || ""
  const roots = []
  for (const part of raw.split(",")) {
    const trimmed = part.trim()
    if (!trimmed) continue
    const absolute = resolve(repoRoot, trimmed)
    if (existsSync(absolute)) roots.push(absolute)
  }
  const sibling = resolve(repoRoot, "../limetry-enterprise")
  if (!raw && existsSync(sibling)) {
    roots.push(sibling)
  }
  return roots
}

const files = new Map()

function addFile(absolutePath, meta = {}) {
  if (!existsSync(absolutePath)) return
  files.set(absolutePath, meta)
}

for (const file of walk(
  join(repoRoot, "packages/web/content/docs"),
  (p) => /\.mdx?$/i.test(p),
)) {
  addFile(file, { product: "oss", pathRoot: repoRoot })
}

for (const name of ["README.md", "INSTALL.md", "USAGE.md", "SECURITY.md"]) {
  addFile(join(repoRoot, name), { product: "oss", pathRoot: repoRoot })
}

addFile(join(repoRoot, "packages/server/openapi.yaml"), { product: "oss", pathRoot: repoRoot })
addFile(join(repoRoot, "packages/limetry-skill/SKILL.md"), { product: "oss", pathRoot: repoRoot })

for (const file of walk(
  join(repoRoot, "packages"),
  (p) => /\/README\.md$/i.test(p) && !p.includes("node_modules"),
)) {
  addFile(file, { product: "oss", pathRoot: repoRoot })
}

for (const file of walk(
  join(repoRoot, "examples"),
  (p) => /\/README\.md$/i.test(p),
)) {
  addFile(file, { product: "oss", pathRoot: repoRoot })
}

for (const extraRoot of resolveExtraRoots()) {
  for (const rel of ENTERPRISE_DOC_FILES) {
    addFile(join(extraRoot, rel), {
      product: "cloud",
      pathRoot: extraRoot,
      sourcePrefix: "limetry-enterprise/",
    })
  }
}

const chunks = []
for (const [file, meta] of [...files.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  const relativePath = relative(meta.pathRoot || repoRoot, file).replace(/\\/g, "/")
  const sourcePath = `${meta.sourcePrefix || ""}${relativePath}`
  const raw = readFileSync(file, "utf8")
  const text = normalizeText(raw)
  if (text.length < 40) continue
  const title = titleFromDoc(sourcePath, text)
  const parts = chunkText(text)
  const priority = sourcePriority(relativePath.startsWith("packages/web/content/docs/")
    ? relativePath
    : sourcePath.replace(/^limetry-enterprise\//, ""))
  parts.forEach((part, index) => {
    const id = createHash("sha1").update(`${sourcePath}:${index}:${part.slice(0, 64)}`).digest("hex").slice(0, 16)
    const heading = part.match(/^#{1,3}\s+(.+)$/m)
    chunks.push({
      id,
      title,
      sourcePath,
      section: heading?.[1]?.trim() || (parts.length > 1 ? undefined : undefined),
      text: part,
      product: meta.product || "oss",
      priority: meta.product === "cloud" ? Math.max(priority, 2) : priority,
      embedding: localHashEmbedding(part),
    })
  })
}

function normalizeText(raw) {
  return stripMdx(raw)
}

mkdirSync(outDir, { recursive: true })
const payload = {
  version: 1,
  generatedAt: new Date().toISOString(),
  chunks,
}
writeFileSync(outFile, `${JSON.stringify(payload)}\n`, "utf8")

const plainDir = join(outDir, "plain")
mkdirSync(plainDir, { recursive: true })
for (const chunk of chunks) {
  const safe = chunk.sourcePath.replace(/[^\w./-]+/g, "_").replace(/\//g, "__")
  const name = `${safe}__${chunk.id}.txt`
  writeFileSync(
    join(plainDir, name),
    `# ${chunk.title}\n# source: ${chunk.sourcePath}\n# product: ${chunk.product}\n\n${chunk.text}\n`,
    "utf8",
  )
}

console.log(`Wrote ${chunks.length} chunks → ${relative(repoRoot, outFile)}`)
console.log(`Wrote plain corpus → ${relative(repoRoot, plainDir)} (upload to S3 for Bedrock KB)`)
