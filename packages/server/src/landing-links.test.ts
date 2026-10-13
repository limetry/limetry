import { describe, expect, it } from "vitest"

import {
  CANONICAL_WEB_ORIGIN,
  docsQuickStartUrl,
  LOCAL_WEB_ORIGIN,
  renderLandingHtml,
  resolveLandingWebOrigin,
  stripHiddenLaunchBlocks,
} from "./landing-links.js"

describe("landing links", () => {
  it("prefers NEXT_PUBLIC_WEB_URL for Docs origin", () => {
    expect(
      resolveLandingWebOrigin({
        NEXT_PUBLIC_WEB_URL: "https://dev.limetry.org/",
      }),
    ).toBe("https://dev.limetry.org")
  })

  it("falls back to LIMETRY_WEB_URL when NEXT_PUBLIC_WEB_URL is unset", () => {
    expect(
      resolveLandingWebOrigin({
        LIMETRY_WEB_URL: "https://staging.limetry.org",
      }),
    ).toBe("https://staging.limetry.org")
  })

  it("uses the canonical OSS marketing origin in production", () => {
    expect(resolveLandingWebOrigin({ NODE_ENV: "production" })).toBe(
      CANONICAL_WEB_ORIGIN,
    )
  })

  it("uses localhost for local development", () => {
    expect(resolveLandingWebOrigin({ NODE_ENV: "development" })).toBe(
      LOCAL_WEB_ORIGIN,
    )
  })

  it("builds the quick-start docs path", () => {
    expect(docsQuickStartUrl("https://dev.limetry.org")).toBe(
      "https://dev.limetry.org/docs/quick-start",
    )
  })

  it("substitutes version and web origin placeholders", () => {
    const html = renderLandingHtml(
      "<a href=\"__WEB_ORIGIN__/docs/quick-start\">Docs</a> v__APP_VERSION__",
      {
        appVersion: "1.2.3",
        webOrigin: "https://dev.limetry.org/",
      },
    )
    expect(html).toBe(
      "<a href=\"https://dev.limetry.org/docs/quick-start\">Docs</a> v1.2.3",
    )
  })

  it("strips Cloud blocks when launch is closed", () => {
    const html = stripHiddenLaunchBlocks(
      "<!-- launching-soon:cloud --><a>Try Limetry Cloud</a><!-- /launching-soon:cloud -->",
      {},
    )
    expect(html).toBe("")
  })

  it("keeps Cloud blocks when launch is open", () => {
    const html = stripHiddenLaunchBlocks(
      "<!-- launching-soon:cloud --><a>Try Limetry Cloud</a><!-- /launching-soon:cloud -->",
      { NEXT_PUBLIC_IS_CLOUD_ENABLED: "true" },
    )
    expect(html).toContain("Try Limetry Cloud")
  })

  it("escapes dynamic landing-page values before rendering HTML", () => {
    const html = renderLandingHtml("<a href=\"__API_ORIGIN__\">__APP_VERSION__</a>", {
      apiOrigin: "https://example.com/?q=\"unsafe\"",
      appVersion: "<script>alert(1)</script>",
      webOrigin: "https://example.com",
    })

    expect(html).toBe(
      "<a href=\"https://example.com/?q=&quot;unsafe&quot;\">&lt;script&gt;alert(1)&lt;/script&gt;</a>",
    )
  })
})
