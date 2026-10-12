import assert from "node:assert/strict"
import { describe, it } from "node:test"

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
    assert.equal(links.product[0]?.href, "/docs/introduction")
    assert.equal(links.opensource.find((l) => l.label === "Changelog")?.href, "/changelog")
    assert.equal(links.legal.privacy.href, "/privacy")
    assert.equal(links.legal.terms.href, "/terms")
    assert.equal(
      links.product.find((l) => l.label === "Limetry Cloud")?.href,
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
    assert.equal(links.opensource.find((l) => l.label === "Blog")?.href, "http://localhost:3800/blog")
    assert.equal(links.legal.privacy.href, "http://localhost:3800/privacy")
    assert.equal(links.docs.find((l) => l.label === "Swagger UI")?.href, "/openapi")
    assert.equal(links.docs.find((l) => l.label === "Swagger UI")?.external, undefined)
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
    assert.equal(links.product.find((l) => l.label === "Limetry Cloud"), undefined)
  })
})
