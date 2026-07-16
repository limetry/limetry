/**
 * Docs shell: site header plus fumadocs layout with custom sticky offsets.
 */

import { DocsLayout } from "fumadocs-ui/layouts/docs"
import type { CSSProperties, ReactNode } from "react"

import { Footer } from "@/components/footer"
import { SiteHeader } from "@/components/site-header"
import { githubPath } from "@/lib/site-urls"
import { source } from "@/lib/source"

/**
 * Sticky offset CSS vars so fumadocs sidebar/TOC clear the site header.
 *
 * SiteHeader is sticky and in document flow (64px). Keep fumadocs nav/search
 * disabled — SiteHeader owns those — so `#nd-subnav` never mounts and cannot
 * set `--fd-header-height` via the layout variant.
 */
const docsOffset: CSSProperties = {
  "--fd-banner-height": "4rem",
  "--fd-header-height": "0px",
  "--fd-nav-height": "0px",
} as CSSProperties

/**
 * Docs route layout wrapping fumadocs `DocsLayout` with site chrome.
 *
 * @param props - Docs page children.
 * @returns Docs shell.
 */
export default function Layout({ children }: { children: ReactNode }): React.JSX.Element {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <div className="limetry-docs flex flex-1 flex-col" style={docsOffset}>
        <DocsLayout
          tree={source.pageTree}
          nav={{
            enabled: false,
          }}
          searchToggle={{
            enabled: false,
          }}
          themeSwitch={{ enabled: false }}
          sidebar={{
            defaultOpenLevel: 1,
            footer: (
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>
                  Open source under{" "}
                  <a
                    href={githubPath("/blob/main/LICENSE")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground"
                  >
                    MIT License
                  </a>
                </p>
              </div>
            ),
          }}
        >
          {children}
        </DocsLayout>
      </div>
      <Footer />
    </div>
  )
}
