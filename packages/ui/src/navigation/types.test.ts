import { describe, expect, it } from "vitest"

import {
  findActiveNavHref,
  isItemHighlighted,
  isNavItemOrChildActive,
  type NavItem,
} from "./types.js"

describe("Navigation Types & Drawer Highlight", () => {
  const docsTree: NavItem[] = [
    { href: "/", label: "Home" },
    { href: "/blog", label: "Blog" },
    {
      href: "/docs/introduction",
      label: "Docs",
      children: [
        { href: "/docs/introduction", label: "Introduction" },
        { href: "/docs/quick-start", label: "Quick Start" },
        {
          href: "/docs/server/self-hosting",
          label: "Server",
          children: [
            { href: "/docs/server/self-hosting", label: "Self Hosted" },
            { href: "/docs/server/docker", label: "Docker" },
          ],
        },
      ],
    },
  ]

  it("identifies deepest matching nav item href", () => {
    const active = findActiveNavHref("/docs/server/self-hosting", docsTree)
    expect(active).toBe("/docs/server/self-hosting")
  })

  it("highlights ONLY the specific leaf child and not the parent section with same href", () => {
    const pathname = "/docs/server/self-hosting"
    const activeHref = findActiveNavHref(pathname, docsTree)
    expect(activeHref).toBe("/docs/server/self-hosting")

    const docsRoot = docsTree[2]!
    const serverFolder = docsRoot.children![2]!
    const selfHostedPage = serverFolder.children![0]!
    const dockerPage = serverFolder.children![1]!

    // Docs root container
    expect(isNavItemOrChildActive(pathname, docsRoot)).toBe(true)
    expect(isItemHighlighted(pathname, docsRoot, activeHref)).toBe(false)

    // Server folder (has same href as selfHostedPage)
    expect(isNavItemOrChildActive(pathname, serverFolder)).toBe(true)
    expect(isItemHighlighted(pathname, serverFolder, activeHref)).toBe(false)

    // Self Hosted leaf page
    expect(isNavItemOrChildActive(pathname, selfHostedPage)).toBe(true)
    expect(isItemHighlighted(pathname, selfHostedPage, activeHref)).toBe(true)

    // Docker sibling page
    expect(isNavItemOrChildActive(pathname, dockerPage)).toBe(false)
    expect(isItemHighlighted(pathname, dockerPage, activeHref)).toBe(false)
  })

  it("highlights the top-level route correctly when navigating to home or blog", () => {
    const home = docsTree[0]!
    const blog = docsTree[1]!

    const blogActiveHref = findActiveNavHref("/blog", docsTree)
    expect(isItemHighlighted("/blog", blog, blogActiveHref)).toBe(true)
    expect(isItemHighlighted("/blog", home, blogActiveHref)).toBe(false)
  })
})
