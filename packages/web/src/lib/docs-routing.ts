/**
 * Docs route helpers shared by the App Router page and its regression tests.
 */

/**
 * Static route params for a fumadocs document.
 */
export type DocsStaticParam = { slug: string[] }

/**
 * Resolves the docs root to the introduction page.
 *
 * @param slug - Optional path segments under `/docs`.
 * @returns Fumadocs slug for the requested page or introduction.
 */
export function resolveDocsSlug(slug?: string[]): string[] {
  return slug?.length ? slug : ["introduction"]
}

/**
 * Adds the optional catch-all root to generated docs paths for static export.
 *
 * @param params - Fumadocs-generated page params.
 * @returns Page params including `/docs`.
 */
export function includeDocsRootParam(params: DocsStaticParam[]): DocsStaticParam[] {
  return [{ slug: [] }, ...params]
}
