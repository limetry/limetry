/**
 * Build-time search catalog merging static pages with fumadocs titles.
 */

import {
  clientSearchCatalog,
  type StaticSearchEntry,
} from "@/lib/site-search-index"
import { source } from "@/lib/source"

/**
 * Static search catalog for `output: export`. Docs titles come from fumadocs at build time.
 *
 * @returns Full catalog including docs pages.
 */
export function buildSearchCatalog(): StaticSearchEntry[] {
  const docsEntries: StaticSearchEntry[] = source.getPages().map((page) => ({
    id: `docs-${page.url}`,
    title: page.data.title,
    description: page.data.description ?? "",
    url: page.url,
    section: "docs",
    keywords: page.data.description ?? "",
  }))

  return [...clientSearchCatalog(), ...docsEntries]
}
