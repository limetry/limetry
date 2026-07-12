/**
 * Static site search entries and client-side substring matching helpers.
 */

import { BLOG_POSTS } from "@/app/blog/posts"
import { EXAMPLES } from "@/app/examples/examples"

/**
 * Top-level search result grouping.
 */
export type SearchSection = "docs" | "examples" | "blog" | "site"

/**
 * Ranked hit returned to the search dialog.
 */
export type SiteSearchHit = {
  id: string
  title: string
  description?: string
  url: string
  section: SearchSection
}

/**
 * Indexable catalog entry with optional keyword bag for matching.
 */
export type StaticSearchEntry = {
  id: string
  title: string
  description: string
  url: string
  section: SearchSection
  keywords?: string
}

/**
 * Non-docs pages indexed with simple substring matching (no extra deps).
 * Docs pages are appended from fumadocs `source.getPages()` in the search catalog.
 */
export const STATIC_SEARCH_ENTRIES: StaticSearchEntry[] = [
  {
    id: "site-home",
    title: "Limetry — Agent Action Governance",
    description: "Open-source policy engine for AI agent tool calls. Evaluate, deny, and audit.",
    url: "/",
    section: "site",
    keywords: "home landing mit mcp cli sdk evaluate self-run",
  },
  {
    id: "site-community",
    title: "Community",
    description: "Join the Limetry community — GitHub, discussions, and contributions.",
    url: "/community",
    section: "site",
    keywords: "community discord github contribute",
  },
  {
    id: "site-changelog",
    title: "Changelog",
    description: "Product updates and release notes for Limetry.",
    url: "/changelog",
    section: "site",
    keywords: "changelog releases updates",
  },
  {
    id: "site-privacy",
    title: "Privacy Policy",
    description: "How Limetry handles privacy for the open-source project and website.",
    url: "/privacy",
    section: "site",
  },
  {
    id: "site-terms",
    title: "Terms of Service",
    description: "Terms governing use of Limetry websites and services.",
    url: "/terms",
    section: "site",
  },
  {
    id: "site-examples-index",
    title: "Examples",
    description: "Framework examples for wiring Limetry into agent loops.",
    url: "/examples",
    section: "examples",
    keywords: "examples github actions copilot shopify sql cursor claude mcp openai langgraph crewai",
  },
  {
    id: "site-blog-index",
    title: "Blog",
    description: "Engineering notes and product announcements from Limetry.",
    url: "/blog",
    section: "blog",
  },
  {
    id: "site-cloud",
    title: "Limetry Cloud",
    description:
      "Organization policies, scoped agent tokens, operator approvals, and plan-based audit — same SDK as open source.",
    url: "/pricing",
    section: "site",
    keywords: "cloud portal organization approvals audit tokens pricing",
  },
]

/**
 * Scores and filters catalog entries with simple substring matching.
 *
 * @param query - User query (min length 2 after trim).
 * @param entries - Catalog to search.
 * @returns Hits sorted by descending score.
 */
export function matchStaticEntries(query: string, entries: StaticSearchEntry[]): SiteSearchHit[] {
  const q = query.trim().toLowerCase()
  if (q.length < 2) {
    return []
  }

  return entries
    .map((entry) => {
      const haystack = `${entry.title} ${entry.description} ${entry.keywords ?? ""}`.toLowerCase()
      const score =
        (entry.title.toLowerCase().includes(q) ? 3 : 0) +
        (entry.description.toLowerCase().includes(q) ? 2 : 0) +
        (haystack.includes(q) ? 1 : 0)
      return { entry, score }
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ entry }) => ({
      id: entry.id,
      title: entry.title,
      description: entry.description,
      url: entry.url,
      section: entry.section,
    }))
}

/**
 * Builds search entries from the examples catalog.
 *
 * @returns One entry per example slug.
 */
export function exampleSearchEntries(): StaticSearchEntry[] {
  return Object.values(EXAMPLES).map((example) => ({
    id: `example-${example.slug}`,
    title: example.name,
    description: example.description,
    url: `/examples/${example.slug}`,
    section: "examples",
    keywords: `${example.lang} ${example.framework} ${example.maturity} ${example.folder}`,
  }))
}

/**
 * Builds search entries from in-repo blog posts.
 *
 * @returns One entry per post slug.
 */
export function blogSearchEntries(): StaticSearchEntry[] {
  return BLOG_POSTS.map((post) => ({
    id: `blog-${post.slug}`,
    title: post.title,
    description: post.description,
    url: `/blog/${post.slug}`,
    section: "blog",
    keywords: post.tags.join(" "),
  }))
}

/**
 * Client-safe catalog without fumadocs pages (docs added at build time).
 *
 * @returns Static site, example, and blog entries.
 */
export function clientSearchCatalog(): StaticSearchEntry[] {
  return [
    ...STATIC_SEARCH_ENTRIES,
    ...exampleSearchEntries(),
    ...blogSearchEntries(),
  ]
}
