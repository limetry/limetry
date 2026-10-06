/**
 * Browser document titles for the public site.
 */

/**
 * Document title `Limetry — {page}`.
 * Absolute skips the root template so the brand stays at the front once.
 *
 * @param page - Page-specific title, without the brand prefix.
 * @returns Next.js metadata title.
 */
export function documentTitle(page: string): { absolute: string } {
  return { absolute: `Limetry — ${page}` }
}
