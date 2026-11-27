/**
 * Canonical site footer link columns shared by Limetry web and API landings.
 *
 * OSS marketing pages (docs, community, blog, changelog, privacy, terms) always
 * resolve to the OSS web origin. OpenAPI points at the caller's API surface.
 */

import { isAbsoluteHttpHref, isLimetryFamilyHref } from "./link-href"

/**
 * One footer destination.
 */
export type SiteFooterLink = {
  href: string
  label: string
  /**
   * When true, open in a new tab (third-party origins only).
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
   * Cloud marketing origin for the Limetry Cloud product link.
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
  const href = `${trimOrigin(input.ossWebOrigin)}${path}`
  return {
    href,
    ...(isLimetryFamilyHref(href) ? {} : { external: true }),
  }
}

/**
 * Builds the shared Product / Open Source / Docs / legal footer destinations.
 *
 * @param input - Origins and OpenAPI target for the current frontend.
 * @returns Column link lists and legal bar links.
 */
export function buildSiteFooterLinks(input: BuildSiteFooterLinksInput): SiteFooterLinks {
  const openApiExternal = isAbsoluteHttpHref(input.openApiHref)
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
      ...(isLimetryFamilyHref(cloudApp) ? {} : { external: true }),
    })
  }
  product.push({
    href: input.openApiHref,
    label: "OpenAPI",
    ...(openApiExternal && !isLimetryFamilyHref(input.openApiHref)
      ? { external: true }
      : {}),
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
        ...(openApiExternal && !isLimetryFamilyHref(input.openApiHref)
          ? { external: true }
          : {}),
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
