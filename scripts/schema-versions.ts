/**
 * Independent schema versions and the product compatibility document.
 *
 * Product releases share one semver. Schemas (OpenAPI, JSON contracts, database)
 * start at 1.0.0 and bump only when their content changes. The compatibility
 * document records which product, package, and website versions work with
 * which schema ranges.
 */

import { createHash } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"

import {
  canonicalizeVersion,
  computeNextVersion,
  formatAppVersionSource,
  type ReleaseBump,
  setPackageVersionText,
} from "./release-version.js"

/** Initial schema semver for a contract that has not been versioned before. */
export const SCHEMA_BASELINE = "1.0.0"

/** How a schema file stores its own version. */
export type SchemaKind = "openapi-yaml" | "openapi-json" | "json" | "text"

/**
 * One schema tracked apart from the product version.
 */
export type SchemaSpec = {
  /**
   * Stable id published in the compatibility document.
   */
  id: string
  /**
   * Repo-relative path of the schema source.
   */
  path: string
  /**
   * How to read and write the version inside {@link SchemaSpec.path}.
   */
  kind: SchemaKind
  /**
   * Optional sidecar that exports the schema version. Its bytes are not part
   * of the content fingerprint.
   */
  versionFile?: string
  /**
   * Exported const name written into {@link SchemaSpec.versionFile}.
   */
  versionConst?: string
  /**
   * Copies that must carry the same version but do not bump on their own.
   */
  mirrors?: SchemaMirror[]
}

/**
 * A generated copy of a schema source.
 */
export type SchemaMirror = {
  /**
   * Repo-relative path.
   */
  path: string
  /**
   * How to stamp the version into this copy.
   */
  kind: SchemaKind
}

/**
 * Recorded schema version and content fingerprint.
 */
export type SchemaRecord = {
  /**
   * Schema id from {@link SchemaSpec.id}.
   */
  id: string
  /**
   * Current schema semver.
   */
  version: string
  /**
   * SHA-256 of the schema with its version field removed.
   */
  fingerprint: string
}

/**
 * On-disk catalog of schema versions.
 */
export type SchemaCatalog = {
  /**
   * Tracked schemas in spec order.
   */
  schemas: SchemaRecord[]
}

/**
 * One published version plus the range this release still accepts.
 */
export type VersionRange = {
  /**
   * Version stamped on this release.
   */
  version: string
  /**
   * Semver range of compatible releases (`>=floor <ceiling`).
   */
  compatible: string
}

/**
 * Compatibility of this product release with packages, websites, and schemas.
 */
export type CompatibilityDocument = {
  /**
   * Shared product semver for packages and websites.
   */
  product: string
  /**
   * Product versions this release can run beside (same minor line).
   */
  compatibleProduct: string
  /**
   * Published package versions and the ranges they accept.
   */
  packages: Record<string, VersionRange>
  /**
   * Website versions and the ranges they accept.
   */
  websites: Record<string, VersionRange>
  /**
   * Schema versions and the ranges this product accepts.
   */
  schemas: Record<string, VersionRange>
}

/**
 * How to stamp a product version into a sibling checkout.
 */
export type PeerStamp = {
  /**
   * Path relative to the sibling repo root.
   */
  path: string
  /**
   * File shape to update.
   */
  kind: "package" | "app-version" | "expo"
}

/**
 * Result of comparing a schema file with its catalog record.
 */
export type SchemaPlan = {
  /**
   * Schema id.
   */
  id: string
  /**
   * Version to write. Unchanged when the fingerprint matches.
   */
  version: string
  /**
   * Fingerprint of the version-stripped contents.
   */
  fingerprint: string
  /**
   * True when the version or file bytes must be written.
   */
  changed: boolean
  /**
   * File contents with the planned version applied.
   */
  contents: string
}

/**
 * Semver range of product releases on the same minor line.
 *
 * @param version - Product version.
 * @returns Range such as `>=1.2.0 <1.3.0`.
 */
export function productCompatibleRange(version: string): string {
  const parsed = canonicalizeVersion(version).split(".")
  const major = parsed[0]
  const minor = Number.parseInt(parsed[1] ?? "0", 10)
  return `>=${major}.${minor}.0 <${major}.${minor + 1}.0`
}

/**
 * Semver range of schema releases on the same major line.
 *
 * @param version - Schema version.
 * @returns Range such as `>=1.0.0 <2.0.0`.
 */
export function schemaCompatibleRange(version: string): string {
  const major = canonicalizeVersion(version).split(".")[0]
  return `>=${major}.0.0 <${Number.parseInt(major ?? "0", 10) + 1}.0.0`
}

/**
 * SHA-256 of schema contents with the version field removed.
 *
 * @param contents - File text.
 * @param kind - Where the version lives in the file.
 * @returns Hex digest.
 */
export function fingerprintContents(contents: string, kind: SchemaKind): string {
  const normalized = kind === "text" ? contents : stripVersion(contents, kind)
  return createHash("sha256").update(normalized).digest("hex")
}

/**
 * Decides the next schema version from the previous fingerprint.
 *
 * A missing fingerprint adopts {@link SCHEMA_BASELINE} without treating the
 * current product version inside the file as a schema bump. A later content
 * change bumps with `bump` (patch unless the caller asks otherwise).
 *
 * @param input - Previous catalog row, file text, and bump to use when it changed.
 * @returns Planned version, fingerprint, and rewritten contents.
 */
export function planSchemaVersion(input: {
  id: string
  kind: SchemaKind
  contents: string
  version: string | null
  previousFingerprint: string | null
  bump: ReleaseBump
}): SchemaPlan {
  const fingerprint = fingerprintContents(input.contents, input.kind)
  const adoptBaseline = input.previousFingerprint == null || input.version == null
  const version = adoptBaseline
    ? SCHEMA_BASELINE
    : input.previousFingerprint === fingerprint
      ? canonicalizeVersion(input.version)
      : computeNextVersion(input.version, input.bump)
  const contents = applySchemaVersion(input.contents, input.kind, version)
  return {
    id: input.id,
    version,
    fingerprint,
    changed: contents !== input.contents || version !== input.version,
    contents,
  }
}

/**
 * Builds the compatibility document for one product release.
 *
 * @param input - Product version, package names, website ids, and schema records.
 * @returns Document safe to publish as JSON.
 */
export function buildCompatibility(input: {
  product: string
  packages: readonly string[]
  websites: readonly string[]
  schemas: readonly SchemaRecord[]
}): CompatibilityDocument {
  const product = canonicalizeVersion(input.product)
  const productRange = productCompatibleRange(product)
  const packages: Record<string, VersionRange> = {}
  for (const name of input.packages) {
    packages[name] = { version: product, compatible: productRange }
  }
  const websites: Record<string, VersionRange> = {}
  for (const name of input.websites) {
    websites[name] = { version: product, compatible: productRange }
  }
  const schemas: Record<string, VersionRange> = {}
  for (const schema of input.schemas) {
    schemas[schema.id] = {
      version: schema.version,
      compatible: schemaCompatibleRange(schema.version),
    }
  }
  return {
    product,
    compatibleProduct: productRange,
    packages,
    websites,
    schemas,
  }
}

/**
 * Adds the trailing commas ESLint requires in a pretty-printed JSON object.
 *
 * JSON forbids those commas. The compatibility module is TypeScript, and
 * `comma-dangle` requires one after the last item of every multiline
 * object. The closing brace of the whole document stays uncomma'd so
 * `as const` remains valid.
 *
 * @param json - Output of `JSON.stringify(value, null, 2)`.
 * @returns The same text with trailing commas inserted.
 */
function withTrailingCommas(json: string): string {
  const lines = json.split("\n")
  return lines.map((line, index) => {
    const next = lines[index + 1]
    if (!next) {
      return line
    }
    const trimmed = line.trimEnd()
    if (
      trimmed.length === 0
      || trimmed.endsWith(",")
      || trimmed.endsWith("{")
      || trimmed.endsWith("[")
    ) {
      return line
    }
    const nextTrimmed = next.trim()
    if (nextTrimmed.startsWith("}") || nextTrimmed.startsWith("]")) {
      return `${trimmed},`
    }
    return line
  }).join("\n")
}

/**
 * TypeScript source that publishes {@link CompatibilityDocument} from a package.
 *
 * @param document - Compatibility document.
 * @returns Module source ending in a newline.
 */
export function formatCompatibilityModule(document: CompatibilityDocument): string {
  return `/**
 * Product, package, website, and schema compatibility for this release.
 */
export const COMPATIBILITY = ${withTrailingCommas(JSON.stringify(document, null, 2))} as const
`
}

/**
 * Sidecar source for a schema version const.
 *
 * @param constName - Exported const identifier.
 * @param version - Schema semver.
 * @returns Module source ending in a newline.
 */
export function formatSchemaVersionSource(constName: string, version: string): string {
  return `/**
 * Schema version for this contract. Independent of the product semver.
 */
export const ${constName} = "${canonicalizeVersion(version)}"
`
}

/**
 * Writes `expo.version` without reformatting the rest of app.json.
 *
 * @param source - app.json text.
 * @param version - Product semver.
 * @returns Updated text.
 * @throws Error When `expo` is missing.
 */
export function setExpoVersionText(source: string, version: string): string {
  const canonical = canonicalizeVersion(version)
  const parsed = JSON.parse(source) as { expo?: { version?: string } }
  if (!parsed.expo) {
    throw new Error("app.json is missing expo config")
  }
  if (parsed.expo.version === canonical) {
    return source
  }
  return source.replace(/("version"\s*:\s*")[^"]*(")/, `$1${canonical}$2`)
}

/**
 * Reads a schema catalog, or an empty catalog when the file is missing.
 *
 * @param catalogPath - Absolute path to versions/schemas.json.
 * @returns Catalog.
 */
export function readSchemaCatalog(catalogPath: string): SchemaCatalog {
  if (!existsSync(catalogPath)) {
    return { schemas: [] }
  }
  return JSON.parse(readFileSync(catalogPath, "utf8")) as SchemaCatalog
}

/**
 * Updates schema files and the catalog. Unchanged schemas keep their version.
 *
 * @param input - Repo root, catalog location, specs, and bump for real changes.
 * @returns Updated catalog and absolute paths written.
 */
export function syncSchemaFiles(input: {
  rootDir: string
  catalogPath: string
  specs: readonly SchemaSpec[]
  bump: ReleaseBump
}): { catalog: SchemaCatalog; written: string[] } {
  const previous = readSchemaCatalog(input.catalogPath)
  const previousById = new Map(previous.schemas.map((record) => [record.id, record]))
  const records: SchemaRecord[] = []
  const written: string[] = []

  for (const spec of input.specs) {
    const absolute = join(input.rootDir, spec.path)
    const source = readFileSync(absolute, "utf8")
    const prior = previousById.get(spec.id)
    const plan = planSchemaVersion({
      id: spec.id,
      kind: spec.kind,
      contents: source,
      version: prior?.version ?? null,
      previousFingerprint: prior?.fingerprint ?? null,
      bump: input.bump,
    })
    if (plan.contents !== source) {
      writeFileSync(absolute, plan.contents)
      written.push(absolute)
    }
    if (spec.versionFile && spec.versionConst) {
      const versionPath = join(input.rootDir, spec.versionFile)
      const nextSource = formatSchemaVersionSource(spec.versionConst, plan.version)
      const current = existsSync(versionPath) ? readFileSync(versionPath, "utf8") : ""
      if (current !== nextSource) {
        mkdirSync(dirname(versionPath), { recursive: true })
        writeFileSync(versionPath, nextSource)
        written.push(versionPath)
      }
    }
    for (const mirror of spec.mirrors ?? []) {
      written.push(...stampMirror(input.rootDir, spec.path, plan.contents, plan.version, mirror))
    }
    records.push({
      id: spec.id,
      version: plan.version,
      fingerprint: plan.fingerprint,
    })
  }

  const catalog: SchemaCatalog = { schemas: records }
  const catalogText = `${JSON.stringify(catalog, null, 2)}\n`
  const previousText = existsSync(input.catalogPath) ? readFileSync(input.catalogPath, "utf8") : ""
  if (previousText !== catalogText) {
    mkdirSync(dirname(input.catalogPath), { recursive: true })
    writeFileSync(input.catalogPath, catalogText)
    written.push(input.catalogPath)
  }
  return { catalog, written }
}

/**
 * Writes the compatibility JSON, a TypeScript module, and static website copies.
 *
 * @param input - Destination paths and the document to publish.
 * @returns Absolute paths written.
 */
export function publishCompatibility(input: {
  document: CompatibilityDocument
  jsonPaths: readonly string[]
  modulePath?: string
}): string[] {
  const json = `${JSON.stringify(input.document, null, 2)}\n`
  const written: string[] = []
  for (const relativePath of input.jsonPaths) {
    const current = existsSync(relativePath) ? readFileSync(relativePath, "utf8") : ""
    if (current === json) {
      continue
    }
    mkdirSync(dirname(relativePath), { recursive: true })
    writeFileSync(relativePath, json)
    written.push(relativePath)
  }
  if (input.modulePath) {
    const source = formatCompatibilityModule(input.document)
    const current = existsSync(input.modulePath) ? readFileSync(input.modulePath, "utf8") : ""
    if (current !== source) {
      mkdirSync(dirname(input.modulePath), { recursive: true })
      writeFileSync(input.modulePath, source)
      written.push(input.modulePath)
    }
  }
  return written
}

/**
 * Stamps the sibling checkout with the same product version when it is present.
 *
 * @param peerRoot - Absolute path to the other stack, if checked out beside this one.
 * @param version - Product semver.
 * @param stamps - Files to update inside the sibling.
 * @returns Absolute paths written.
 */
export function stampPeerProduct(
  peerRoot: string,
  version: string,
  stamps: readonly PeerStamp[],
): string[] {
  if (!existsSync(join(peerRoot, "package.json"))) {
    return []
  }
  const canonical = canonicalizeVersion(version)
  const written: string[] = []
  for (const stamp of stamps) {
    const absolute = join(peerRoot, stamp.path)
    if (!existsSync(absolute)) {
      continue
    }
    const source = readFileSync(absolute, "utf8")
    const next = stamp.kind === "package"
      ? setPackageVersionText(source, canonical)
      : stamp.kind === "app-version"
        ? formatAppVersionSource(canonical)
        : setExpoVersionText(source, canonical)
    if (next !== source) {
      writeFileSync(absolute, next)
      written.push(absolute)
    }
  }
  return written
}

/**
 * Writes a schema version into file text.
 *
 * @param contents - Original file text.
 * @param kind - Version location.
 * @param version - Schema semver.
 * @returns Updated text.
 */
function applySchemaVersion(contents: string, kind: SchemaKind, version: string): string {
  if (kind === "text") {
    return contents
  }
  if (kind === "openapi-yaml") {
    return setOpenApiYamlVersion(contents, version)
  }
  if (kind === "openapi-json") {
    return setOpenApiJsonVersion(contents, version)
  }
  return setJsonSchemaVersion(contents, version)
}

/**
 * Removes the version field so a version stamp does not change the fingerprint.
 *
 * @param contents - Original file text.
 * @param kind - Version location.
 * @returns Canonical text without the version.
 */
function stripVersion(contents: string, kind: SchemaKind): string {
  if (kind === "openapi-yaml") {
    return setOpenApiYamlVersion(contents, "")
  }
  if (kind === "openapi-json") {
    const document = JSON.parse(contents) as { info?: { version?: string } }
    if (document.info) {
      delete document.info.version
    }
    return JSON.stringify(document)
  }
  const document = JSON.parse(contents) as { schemaVersion?: string }
  delete document.schemaVersion
  return JSON.stringify(document)
}

/**
 * Replaces `info.version` in an OpenAPI YAML document.
 *
 * @param source - YAML text.
 * @param version - Version to write. Empty string clears the value for fingerprinting.
 * @returns Updated YAML.
 * @throws Error When `info.version` is missing.
 */
export function setOpenApiYamlVersion(source: string, version: string): string {
  const lines = source.split("\n")
  let inInfo = false
  let replaced = false
  const next = lines.map((line) => {
    if (!replaced && line === "info:") {
      inInfo = true
      return line
    }
    if (!inInfo || replaced) {
      return line
    }
    if (line.trim() !== "" && !line.startsWith(" ") && !line.startsWith("\t")) {
      inInfo = false
      return line
    }
    if (/^\s*version:\s*/.test(line)) {
      replaced = true
      const prefix = line.match(/^\s*/)?.[0] ?? ""
      return `${prefix}version: ${version}`.trimEnd()
    }
    return line
  })
  if (!replaced) {
    throw new Error("OpenAPI YAML is missing info.version")
  }
  return next.join("\n")
}

/**
 * Replaces the first `version` string in an OpenAPI JSON document.
 *
 * @param source - JSON text.
 * @param version - Schema semver.
 * @returns Updated JSON text.
 * @throws Error When `info` is missing.
 */
export function setOpenApiJsonVersion(source: string, version: string): string {
  const document = JSON.parse(source) as { info?: { version?: string } }
  if (!document.info) {
    throw new Error("OpenAPI JSON is missing info")
  }
  if (document.info.version === version) {
    return source
  }
  return source.replace(/("version"\s*:\s*")[^"]*(")/, `$1${version}$2`)
}

/**
 * Sets `schemaVersion` on a JSON schema document.
 *
 * @param source - JSON text.
 * @param version - Schema semver.
 * @returns Updated JSON text.
 */
export function setJsonSchemaVersion(source: string, version: string): string {
  const document = JSON.parse(source) as { schemaVersion?: string }
  if (document.schemaVersion === version) {
    return source
  }
  if (typeof document.schemaVersion === "string") {
    return source.replace(/("schemaVersion"\s*:\s*")[^"]*(")/, `$1${version}$2`)
  }
  return source.replace(/^\{/, `{\n  "schemaVersion": "${version}",`)
}

/**
 * Stamps one mirror. `copy` mirrors receive the source bytes.
 *
 * @param rootDir - Repo root.
 * @param sourcePath - Repo-relative source path.
 * @param sourceContents - Source file after its version stamp.
 * @param version - Schema semver.
 * @param mirror - Mirror to update.
 * @returns Paths written.
 */
function stampMirror(
  rootDir: string,
  sourcePath: string,
  sourceContents: string,
  version: string,
  mirror: SchemaMirror,
): string[] {
  const absolute = join(rootDir, mirror.path)
  if (mirror.kind === "text") {
    if (!existsSync(absolute)) {
      return []
    }
    const current = readFileSync(absolute, "utf8")
    if (current === sourceContents && mirror.path === sourcePath) {
      return []
    }
  }
  if (mirror.kind === "openapi-yaml") {
    if (existsSync(absolute) && readFileSync(absolute, "utf8") === sourceContents) {
      return []
    }
    mkdirSync(dirname(absolute), { recursive: true })
    writeFileSync(absolute, sourceContents)
    return [absolute]
  }
  if (!existsSync(absolute)) {
    return []
  }
  const current = readFileSync(absolute, "utf8")
  const next = applySchemaVersion(current, mirror.kind, version)
  if (next === current) {
    return []
  }
  writeFileSync(absolute, next)
  return [absolute]
}
