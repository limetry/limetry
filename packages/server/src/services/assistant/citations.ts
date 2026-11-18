/**
 * Maps assistant source paths to public docs hrefs and display titles.
 */

import type { AssistantProduct, AssistantSource } from "./types.js"

const DOCS_PREFIX = "packages/web/content/docs/"

const ROOT_GUIDE_HREFS: Record<string, string> = {
  "README.md": "/docs/introduction",
  "INSTALL.md": "/docs/server/self-hosting",
  "USAGE.md": "/docs/quick-start",
  "SECURITY.md": "/docs/server/data-minimization",
}

const PACKAGE_README_HREFS: Record<string, string> = {
  "packages/sdk/README.md": "/docs/sdk",
  "packages/mcp/README.md": "/docs/mcp",
  "packages/sql/README.md": "/docs/sql",
  "packages/server/README.md": "/docs/server/architecture",
  "packages/ci/README.md": "/docs/ci",
  "packages/evaluate/README.md": "/docs/quick-start",
}

/**
 * Normalizes corpus / Bedrock / S3-style source paths to repo-relative form.
 *
 * @param sourcePath - Raw path from retrieval.
 * @returns Normalized forward-slash path.
 */
export function normalizeSourcePath(sourcePath: string): string {
  let normalized = sourcePath.replace(/\\/g, "/").trim()
  const s3Match = normalized.match(/^s3:\/\/[^/]+\/(.+)$/i)
  if (s3Match?.[1]) {
    normalized = s3Match[1]
  }
  normalized = normalized.replace(/^\/+/, "")
  const plainPrefix = "docs/assistant/corpus/plain/"
  if (normalized.startsWith(plainPrefix)) {
    const leaf = normalized.slice(plainPrefix.length)
    normalized = leaf
      .replace(/__[a-f0-9]{8,}(?:\.txt)?$/i, "")
      .replace(/\.txt$/i, "")
      .replace(/__/g, "/")
  } else {
    normalized = normalized.replace(/\.txt$/i, "")
  }
  // Keep limetry-enterprise/ so Cloud sources are not mistaken for OSS root guides.
  return normalized
}

/**
 * Maps a corpus source path to an in-site docs href when possible.
 *
 * @param sourcePath - Repo-relative or S3-style path from the assistant corpus.
 * @returns Site-relative docs URL or null.
 */
export function assistantHrefForSource(sourcePath: string): string | null {
  const normalized = normalizeSourcePath(sourcePath)
  if (
    normalized.startsWith("limetry-enterprise/")
    || normalized.startsWith("enterprise/")
  ) {
    // Enterprise docs are not published under OSS /docs routes.
    return null
  }
  if (normalized.startsWith(DOCS_PREFIX)) {
    const rest = normalized.slice(DOCS_PREFIX.length).replace(/\.mdx?$/i, "")
    if (rest === "index" || rest.endsWith("/index")) {
      return "/docs"
    }
    return `/docs/${rest}`
  }
  if (ROOT_GUIDE_HREFS[normalized]) {
    return ROOT_GUIDE_HREFS[normalized]
  }
  if (PACKAGE_README_HREFS[normalized]) {
    return PACKAGE_README_HREFS[normalized]
  }
  if (normalized.startsWith("docs/") && /\.mdx?$/i.test(normalized)) {
    const rest = normalized.slice("docs/".length).replace(/\.mdx?$/i, "")
    if (
      rest === "GOLDEN_PATH"
      || rest === "SSO_AND_IDENTITY"
      || rest === "DEPLOYMENT_AND_DR"
      || rest === "FREE_PLAN_CERTIFICATION"
      || rest === "STAGING_FREE_PLAN"
    ) {
      return null
    }
  }
  return null
}

/**
 * Returns a human citation label without chunk jargon.
 *
 * @param source - Retrieved source.
 * @returns Display title.
 */
/**
 * True when a retrieval title is corpus/Bedrock artifact metadata, not a doc title.
 *
 * @param title - Candidate title.
 * @returns Whether to ignore the title for citation labels.
 */
function isArtifactCitationTitle(title: string): boolean {
  if (/^chunk-\d+$/i.test(title)) {
    return true
  }
  // Plain-corpus S3 objects look like `SECURITY.md__<hash>.txt`.
  if (/__[a-f0-9]{8,}/i.test(title)) {
    return true
  }
  if (/\.txt$/i.test(title)) {
    return true
  }
  return false
}

export function citationLabel(source: Pick<AssistantSource, "title" | "sourcePath" | "section">): string {
  const title = source.title?.trim()
  if (title && !isArtifactCitationTitle(title)) {
    return title
  }
  const path = normalizeSourcePath(source.sourcePath)
  const base = path.split("/").pop() ?? path
  return base.replace(/\.(mdx?|ya?ml|json|txt)$/i, "")
}

/**
 * Infers product stack from path / metadata.
 *
 * @param sourcePath - Normalized or raw path.
 * @param explicit - Optional explicit product tag.
 * @returns Product tag.
 */
export function inferProduct(
  sourcePath: string,
  explicit?: AssistantProduct,
): AssistantProduct {
  if (explicit) {
    return explicit
  }
  const normalized = normalizeSourcePath(sourcePath).toLowerCase()
  if (
    normalized.includes("limetry-enterprise")
    || normalized.startsWith("docs/golden_path")
    || normalized.startsWith("docs/sso_")
    || normalized.startsWith("docs/deployment_")
    || normalized.includes("cloud/")
  ) {
    return "cloud"
  }
  return "oss"
}

/**
 * Enriches sources with href, clean section labels, and product tags.
 *
 * @param sources - Raw retrieved sources.
 * @returns Sources ready for API + UI.
 */
export function enrichSources(sources: AssistantSource[]): AssistantSource[] {
  return sources.map((source) => {
    const sourcePath = normalizeSourcePath(source.sourcePath)
    const section = source.section && !/^chunk-\d+$/i.test(source.section)
      ? source.section
      : undefined
    return {
      ...source,
      sourcePath,
      section,
      title: citationLabel({ ...source, sourcePath }),
      href: assistantHrefForSource(sourcePath) ?? undefined,
      product: inferProduct(sourcePath, source.product),
      snippet: snapSnippet(source.snippet),
    }
  })
}

/**
 * Snaps snippet bounds to word characters to avoid mid-token cuts.
 *
 * @param snippet - Raw snippet text.
 * @param maxLength - Max characters.
 * @returns Cleaned snippet.
 */
export function snapSnippet(snippet: string, maxLength = 500): string {
  const collapsed = snippet.replace(/\s+/g, " ").trim()
  if (collapsed.length <= maxLength) {
    return collapsed
  }
  let slice = collapsed.slice(0, maxLength)
  const lastSpace = slice.lastIndexOf(" ")
  if (lastSpace > Math.floor(maxLength * 0.6)) {
    slice = slice.slice(0, lastSpace)
  }
  slice = slice.replace(/^[^\w`]+/, "").replace(/[^\w`.]+$/, "")
  return `${slice}…`
}
