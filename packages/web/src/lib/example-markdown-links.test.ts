import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  exampleRepoBasePath,
  resolveExampleMarkdownHref,
  resolveExampleRepoPath,
} from "./example-markdown-links"

describe("example markdown links", () => {
  it("builds the examples/ repo base path for catalog folders", () => {
    assert.equal(
      exampleRepoBasePath("shopify-mutation-firewall"),
      "examples/shopify-mutation-firewall",
    )
    assert.equal(
      exampleRepoBasePath("archive/old-example"),
      "archive/old-example",
    )
  })

  it("resolves relative example files under the example folder", () => {
    assert.equal(
      resolveExampleRepoPath("./SKILL.md", "shopify-mutation-firewall"),
      "examples/shopify-mutation-firewall/SKILL.md",
    )
    assert.equal(
      resolveExampleRepoPath("./src/support-ops-agent.ts", "shopify-mutation-firewall"),
      "examples/shopify-mutation-firewall/src/support-ops-agent.ts",
    )
  })

  it("resolves paths that climb to the repo root", () => {
    assert.equal(
      resolveExampleRepoPath(
        "../../.github/workflows/limetry-shopify-gate.yml",
        "shopify-mutation-firewall",
      ),
      ".github/workflows/limetry-shopify-gate.yml",
    )
  })

  it("rejects path traversal outside the repository", () => {
    assert.equal(
      resolveExampleRepoPath("../../../etc/passwd", "shopify-mutation-firewall"),
      undefined,
    )
  })

  it("rewrites relative README links to GitHub blob URLs", () => {
    const link = resolveExampleMarkdownHref("./SKILL.md", "shopify-mutation-firewall")
    assert.equal(link.type, "link")
    if (link.type === "link") {
      assert.match(link.href, /\/blob\/main\/examples\/shopify-mutation-firewall\/SKILL\.md$/)
      assert.equal(link.external, true)
    }
  })

  it("passes through absolute site and https links", () => {
    assert.deepEqual(
      resolveExampleMarkdownHref("/docs/quick-start", "shopify-mutation-firewall"),
      { type: "link", href: "/docs/quick-start", external: false },
    )
    assert.deepEqual(
      resolveExampleMarkdownHref("https://limetry.com/docs/quick-start", "shopify-mutation-firewall"),
      { type: "link", href: "https://limetry.com/docs/quick-start", external: true },
    )
    assert.deepEqual(
      resolveExampleMarkdownHref("#decisions", "shopify-mutation-firewall"),
      { type: "link", href: "#decisions", external: false },
    )
  })

  it("strips unsafe schemes instead of creating anchors", () => {
    assert.deepEqual(
      resolveExampleMarkdownHref("javascript:alert(1)", "shopify-mutation-firewall"),
      { type: "plain" },
    )
    assert.deepEqual(
      resolveExampleMarkdownHref("data:text/html,hi", "shopify-mutation-firewall"),
      { type: "plain" },
    )
  })
})
