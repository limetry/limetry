/**
 * Static JSON search catalog for `\@limetry/web` (S3/CloudFront export safe).
 *
 * Path is `/search.json` (not `/api/…`) because limetry.org CloudFront routes
 * all `/api*` traffic to `@limetry/api` (Ask Limetry + contact) — a static
 * catalog under `/api/search` would never reach S3 in production.
 */

import { buildSearchCatalog } from "@/lib/site-search-catalog"

/**
 * Force static generation for CloudFront/S3 export.
 */
export const dynamic = "force-static"

/**
 * Disable incremental revalidation for the static catalog.
 */
export const revalidate = false

/**
 * Returns the full site search catalog. Query matching runs in the browser so
 * this route can be statically exported to S3/CloudFront as `search.json`.
 *
 * @returns JSON response with `{ entries }`.
 */
export function GET(): Response {
  return Response.json({ entries: buildSearchCatalog() })
}
