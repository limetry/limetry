/**
 * Canonical site footer link columns shared by Limetry web and API landings.
 *
 * OSS marketing pages (docs, community, blog, changelog, privacy, terms) always
 * resolve to the OSS web origin. OpenAPI points at the caller's API surface.
 */

/**
 * One footer destination.
 */
export type SiteFooterLink = {
  href: string
  label: string
  /**
   * When true, open in a new tab (third-party or cross-product origins).
   */
  external?: boolean
}

/**
 * Inputs for {@link buildSiteFooterLinks}.
 */
export type BuildSiteFooterLinksInput = {
  /**
   * Authoritative OSS marketing origin (`https://limetry.org` or local `:3800`).
   */
  ossWebOrigin: string
  /**
   * Cloud portal / app origin for the Limetry Cloud product link.
   */
  cloudAppOrigin: string
  /**
   * This surface's OpenAPI / Swagger UI href (may be same-origin `/openapi`).
   */
  openApiHref: string
  /**
   * Public GitHub repository URL.
   */
  githubUrl: string
  /**
   * When true, include the Limetry Cloud product link.
   */
  includeCloudLink?: boolean
  /**
   * When true, OSS destinations use path-only hrefs (caller is the OSS site).
   */
  ossLinksRelative?: boolean
}

/**
 * Footer column groups plus legal bar destinations.
 */
export type SiteFooterLinks = {
  product: SiteFooterLink[]
  opensource: SiteFooterLink[]
  docs: SiteFooterLink[]
  legal: {
    privacy: SiteFooterLink
    terms: SiteFooterLink
  }
  blurb: string
}

/**
 * Trims a trailing slash from an origin or URL.
 *
 * @param value - Origin or absolute URL.
 * @returns Value without a trailing `/`.
 */
function trimOrigin(value: string): string {
  return value.trim().replace(/\/$/, "")
}

/**
 * Builds an OSS marketing href (relative on the OSS site, absolute elsewhere).
 *
 * @param path - Absolute path beginning with `/`.
 * @param input - Footer build inputs.
 * @returns Href and whether it should open externally.
 */
function ossHref(
  path: string,
  input: BuildSiteFooterLinksInput,
): Pick<SiteFooterLink, "href" | "external"> {
  if (input.ossLinksRelative) {
    return { href: path }
  }
  return {
    href: `${trimOrigin(input.ossWebOrigin)}${path}`,
    external: true,
  }
}

/**
 * True when `href` is an absolute `http(s)` URL.
 *
 * @param href - Link destination.
 * @returns Whether the href leaves the current document origin as an absolute URL.
 */
function isAbsoluteHttp(href: string): boolean {
  return /^https?:\/\//i.test(href)
}

/**
 * Builds the shared Product / Open Source / Docs / legal footer destinations.
 *
 * @param input - Origins and OpenAPI target for the current frontend.
 * @returns Column link lists and legal bar links.
 */
export function buildSiteFooterLinks(input: BuildSiteFooterLinksInput): SiteFooterLinks {
  const openApiExternal = isAbsoluteHttp(input.openApiHref)
  const cloudApp = trimOrigin(input.cloudAppOrigin)
  const github = trimOrigin(input.githubUrl)

  const product: SiteFooterLink[] = [
    { label: "Docs", ...ossHref("/docs/introduction", input) },
    { label: "Examples", ...ossHref("/examples", input) },
    { label: "Quick start", ...ossHref("/docs/quick-start", input) },
  ]
  if (input.includeCloudLink) {
    product.push({
      href: cloudApp,
      label: "Limetry Cloud",
      external: true,
    })
  }
  product.push({
    href: input.openApiHref,
    label: "OpenAPI",
    ...(openApiExternal ? { external: true } : {}),
  })

  return {
    product,
    opensource: [
      { href: github, label: "GitHub", external: true },
      { label: "Community", ...ossHref("/community", input) },
      { label: "Blog", ...ossHref("/blog", input) },
      { label: "Changelog", ...ossHref("/changelog", input) },
    ],
    docs: [
      { label: "Quick Start", ...ossHref("/docs/quick-start", input) },
      { label: "SDK Reference", ...ossHref("/docs/sdk", input) },
      { label: "Deploy", ...ossHref("/docs/server/self-hosting", input) },
      {
        href: input.openApiHref,
        label: "Swagger UI",
        ...(openApiExternal ? { external: true } : {}),
      },
    ],
    legal: {
      privacy: { label: "Privacy", ...ossHref("/privacy", input) },
      terms: { label: "Terms", ...ossHref("/terms", input) },
    },
    blurb:
      "Agent action governance — evaluate, allow, deny, and audit tool calls before they land.",
  }
}
