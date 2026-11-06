#!/usr/bin/env node
/**
 * Builds docs/ai-rag/corpus/rag-corpus.json from Limetry markdown sources.
 *
 * Usage (from repo root or packages/server):
 *   yarn workspace @limetry/server rag:ingest
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
const outDir = resolve(repoRoot, "docs/ai-rag/corpus")
const outFile = join(outDir, "rag-corpus.json")

const LOCAL_EMBED_DIM = 256

function stripMdx(raw) {
  return raw
    .replace(/^---[\s\S]*?---\s*/m, "")
    .replace(/```[\s\S]*?```/g, (block) => block.replace(/```\w*/g, "").trim())
    .replace(/import\s+.+from\s+["'].+["'];?/g, "")
    .replace(/<\/?[A-Za-z][^>]*>/g, " ")
    .replace(/\{[^}]+\}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function chunkText(text, chunkSize = 1_200, overlap = 200) {
  const cleaned = text.replace(/\r\n/g, "\n").trim()
  if (!cleaned) return []
  if (cleaned.length <= chunkSize) return [cleaned]
  const chunks = []
  let start = 0
  while (start < cleaned.length) {
    const end = Math.min(cleaned.length, start + chunkSize)
    const slice = cleaned.slice(start, end).trim()
    if (slice) chunks.push(slice)
    if (end >= cleaned.length) break
    start = Math.max(0, end - overlap)
  }
  return chunks
}

function titleFromDoc(sourcePath, text) {
  const heading = text.match(/^#\s+(.+)$/m)
  if (heading?.[1]) return heading[1].trim()
  const base = sourcePath.split("/").pop() ?? sourcePath
  return base.replace(/\.(mdx?|ya?ml|json)$/i, "")
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
    if (entry === "node_modules" || entry === "dist" || entry === ".git") continue
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) walk(full, predicate, acc)
    else if (predicate(full)) acc.push(full)
  }
  return acc
}

const roots = [
  join(repoRoot, "packages/web/content/docs"),
  join(repoRoot, "packages"),
  join(repoRoot, "examples"),
  repoRoot,
]

const files = new Set()
for (const root of [
  ...walk(join(repoRoot, "packages/web/content/docs"), (p) => /\.mdx?$/i.test(p)),
  join(repoRoot, "README.md"),
  join(repoRoot, "INSTALL.md"),
  join(repoRoot, "USAGE.md"),
  join(repoRoot, "SECURITY.md"),
  join(repoRoot, "packages/server/openapi.yaml"),
  join(repoRoot, "packages/limetry-skill/SKILL.md"),
  ...walk(join(repoRoot, "packages"), (p) => /\/README\.md$/i.test(p) && !p.includes("node_modules")),
  ...walk(join(repoRoot, "examples"), (p) => /\/README\.md$/i.test(p)),
]) {
  if (existsSync(root)) files.add(root)
}

const chunks = []
for (const file of [...files].sort()) {
  const sourcePath = relative(repoRoot, file).replace(/\\/g, "/")
  const raw = readFileSync(file, "utf8")
  const text = /\.mdx$/i.test(file) ? stripMdx(raw) : raw.trim()
  if (text.length < 40) continue
  const title = titleFromDoc(sourcePath, text)
  const parts = chunkText(text)
  parts.forEach((part, index) => {
    const id = createHash("sha1").update(`${sourcePath}:${index}:${part.slice(0, 64)}`).digest("hex").slice(0, 16)
    chunks.push({
      id,
      title,
      sourcePath,
      section: parts.length > 1 ? `chunk-${index + 1}` : undefined,
      text: part,
      embedding: localHashEmbedding(part),
    })
  })
}

mkdirSync(outDir, { recursive: true })
const payload = {
  version: 1,
  generatedAt: new Date().toISOString(),
  chunks,
}
writeFileSync(outFile, `${JSON.stringify(payload)}\n`, "utf8")

// Also emit a plain-text tree suitable for S3 → Bedrock KB sync.
const plainDir = join(outDir, "plain")
mkdirSync(plainDir, { recursive: true })
for (const chunk of chunks) {
  const safe = chunk.sourcePath.replace(/[^\w./-]+/g, "_").replace(/\//g, "__")
  const name = `${safe}__${chunk.id}.txt`
  writeFileSync(
    join(plainDir, name),
    `# ${chunk.title}\n# source: ${chunk.sourcePath}\n\n${chunk.text}\n`,
    "utf8",
  )
}

console.log(`Wrote ${chunks.length} chunks → ${relative(repoRoot, outFile)}`)
console.log(`Wrote plain corpus → ${relative(repoRoot, plainDir)} (upload to S3 for Bedrock KB)`)
void roots
