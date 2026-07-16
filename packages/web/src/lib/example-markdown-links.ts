/**
 * Rewrites relative example README links for the static marketing site.
 *
 * Repo-local paths become GitHub blob URLs. Unsafe or unresolvable hrefs are
 * returned as plain text (no anchor) so the browser never navigates to a 404.
 */

import path from "node:path"

import { githubPath } from "./site-urls"

export type ExampleMarkdownLink =
  | {
    type: "link"
    href: string
    external: boolean
  }
  | {
    type: "plain"
  }

/**
 * Repo-relative directory that contains the example sources.
 *
 * @param exampleFolder - Catalog `folder` field (e.g. `shopify-mutation-firewall`).
 * @returns Path under the git root such as `examples/shopify-mutation-firewall`.
 */
export function exampleRepoBasePath(exampleFolder: string): string {
  if (exampleFolder.startsWith("archive/")) {
    return exampleFolder.replace(/\/+$/, "")
  }
  return `examples/${exampleFolder.replace(/^\/+|\/+$/g, "")}`
}

/**
 * True when the href is an absolute URL or fragment that should stay unchanged.
 *
 * @param href - Raw markdown link target.
 * @returns Whether the href is already browser-safe without rewriting.
 */
function isPassthroughHref(href: string): boolean {
  return (
    href.startsWith("#")
    || href.startsWith("mailto:")
    || href.startsWith("https://")
    || href.startsWith("http://")
    || href.startsWith("/")
  )
}

/**
 * Rejects schemes that must never become anchors on the marketing site.
 *
 * @param href - Raw markdown link target.
 * @returns True when the href is unsafe.
 */
function isUnsafeHref(href: string): boolean {
  return /^(javascript|data|vbscript|file):/i.test(href.trim())
}

/**
 * Resolves a relative path against the example directory without escaping the repo.
 *
 * @param href - Relative markdown path (e.g. `./SKILL.md`, `../../.github/...`).
 * @param exampleFolder - Catalog `folder` field.
 * @returns Normalized repo-relative path, or `undefined` when outside the repo.
 */
export function resolveExampleRepoPath(
  href: string,
  exampleFolder: string,
): string | undefined {
  const base = exampleRepoBasePath(exampleFolder)
  const joined = path.posix.normalize(path.posix.join(base, href))
  if (joined === ".." || joined.startsWith("../")) {
    return undefined
  }
  return joined.replace(/^\.\//, "")
}

/**
 * Maps an example README href to a web-safe link or plain text.
 *
 * @param href - Raw markdown `href`, possibly undefined.
 * @param exampleFolder - Catalog `folder` field for the current example page.
 * @returns Link descriptor for ReactMarkdown, or plain text when not linkable.
 */
export function resolveExampleMarkdownHref(
  href: string | undefined,
  exampleFolder: string,
): ExampleMarkdownLink {
  if (!href || href.trim().length === 0) {
    return { type: "plain" }
  }

  const trimmed = href.trim()
  if (isUnsafeHref(trimmed)) {
    return { type: "plain" }
  }

  if (isPassthroughHref(trimmed)) {
    const external = /^https?:\/\//i.test(trimmed)
    return { type: "link", href: trimmed, external }
  }

  const repoPath = resolveExampleRepoPath(trimmed, exampleFolder)
  if (!repoPath) {
    return { type: "plain" }
  }

  return {
    type: "link",
    href: githubPath(`/blob/main/${repoPath}`),
    external: true,
  }
}
