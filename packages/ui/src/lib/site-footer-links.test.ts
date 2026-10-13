import { describe, expect, it } from "vitest"

import { buildSiteFooterLinks } from "./site-footer-links"

describe("buildSiteFooterLinks", () => {
  it("uses relative OSS paths on the OSS marketing site", () => {
    const links = buildSiteFooterLinks({
      ossWebOrigin: "https://limetry.org",
      cloudAppOrigin: "https://app.limetry.com",
      openApiHref: "https://api.limetry.org/openapi",
      githubUrl: "https://github.com/limetry/limetry",
      includeCloudLink: true,
      ossLinksRelative: true,
    })
    expect(links.product[0]?.href).toBe("/docs/introduction")
    expect(links.opensource.find((l) => l.label === "Changelog")?.href).toBe("/changelog")
    expect(links.legal.privacy.href).toBe("/privacy")
    expect(links.legal.terms.href).toBe("/terms")
    expect(links.product.find((l) => l.label === "Limetry Cloud")?.href).toBe(
      "https://app.limetry.com",
    )
  })

  it("points Cloud and API surfaces at absolute OSS destinations", () => {
    const links = buildSiteFooterLinks({
      ossWebOrigin: "http://localhost:3800",
      cloudAppOrigin: "http://localhost:3830",
      openApiHref: "/openapi",
      githubUrl: "https://github.com/limetry/sdk",
      includeCloudLink: true,
      ossLinksRelative: false,
    })
    expect(links.opensource.find((l) => l.label === "Blog")?.href).toBe("http://localhost:3800/blog")
    expect(links.legal.privacy.href).toBe("http://localhost:3800/privacy")
    expect(links.docs.find((l) => l.label === "Swagger UI")?.href).toBe("/openapi")
    expect(links.docs.find((l) => l.label === "Swagger UI")?.external).toBeUndefined()
  })

  it("omits Limetry Cloud when includeCloudLink is false", () => {
    const links = buildSiteFooterLinks({
      ossWebOrigin: "https://limetry.org",
      cloudAppOrigin: "https://app.limetry.com",
      openApiHref: "/openapi",
      githubUrl: "https://github.com/limetry/limetry",
      includeCloudLink: false,
      ossLinksRelative: true,
    })
    expect(links.product.find((l) => l.label === "Limetry Cloud")).toBeUndefined()
  })
})
