/**
 * Static JSON search catalog API for `\@limetry/web` (S3/CloudFront export safe).
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
 * this route can be statically exported to S3/CloudFront.
 *
 * @returns JSON response with `{ entries }`.
 */
export function GET(): Response {
  return Response.json({ entries: buildSearchCatalog() })
}
