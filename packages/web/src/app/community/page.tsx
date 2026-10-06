/**
 * Community hub: Discord, GitHub Discussions, contributing, and docs links.
 */

import type { Metadata } from "next"
import Link from "next/link"

import { IconAccent } from "@/components/brand"
import { Footer } from "@/components/footer"
import { SiteHeader } from "@/components/site-header"
import { documentTitle } from "@/lib/document-title"
import { githubPath, siteUrls } from "@/lib/site-urls"

/**
 * Community page SEO metadata.
 */
export const metadata: Metadata = {
  title: documentTitle("Community"),
  description: "Discord, GitHub Discussions, contributing guide, and documentation for Limetry.",
}

const LINKS = [
  {
    href: siteUrls.discord,
    icon: "💬",
    title: "Discord",
    description: "Chat with maintainers and other developers building with Limetry. Ask questions and share adapters.",
    cta: "Join Discord",
    external: true,
  },
  {
    href: githubPath("/discussions"),
    icon: "🗣️",
    title: "GitHub Discussions",
    description: "Questions, feature proposals, and show-and-tell. Public, searchable, and indexed.",
    cta: "Open Discussions",
    external: true,
  },
  {
    href: githubPath("/blob/main/CONTRIBUTING.md"),
    icon: "🛠️",
    title: "Contributing",
    description: "PRs welcome for bug fixes, new examples, and SDK improvements. Read the contributor guide first.",
    cta: "Contributor Guide",
    external: true,
  },
  {
    href: "/docs/introduction",
    icon: "📚",
    title: "Documentation",
    description: "Limetry SDK reference, action policy schema, self-run setup, and integration examples.",
    cta: "Read the Docs",
    external: false,
  },
]

/**
 * Renders the Community page.
 *
 * @returns Page layout.
 */
export default function CommunityPage(): React.JSX.Element {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="relative flex-1 overflow-hidden py-16 sm:py-24">
        <IconAccent className="-left-40 top-10 h-[420px] w-[420px] opacity-[0.05] -rotate-12" />
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">Community</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
              Build in public. Ship adapters together.
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground leading-relaxed">
              Limetry is open source under the MIT License. Issues, discussions, and releases happen
              in public. Join Discord or Discussions when you need help wiring evaluate.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noopener noreferrer" : undefined}
                className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between">
                  <span className="text-3xl">{link.icon}</span>
                  {link.external && (
                    <svg
                      className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  )}
                </div>
                <div>
                  <h2 className="font-bold text-foreground group-hover:text-primary transition-colors">{link.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{link.description}</p>
                </div>
                <span className="mt-auto text-sm font-semibold text-primary">{link.cta} →</span>
              </Link>
            ))}
          </div>

          {/* Open source stats */}
          <div className="mt-12 rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center">
            <h2 className="text-lg font-bold text-foreground">Open source</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              The TypeScript SDK, CLI, MCP server, and evaluation server are MIT licensed. Star the
              repo, open an issue, or send a PR when you find a gap.
            </p>
            <Link
              href={siteUrls.github}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 whitespace-nowrap rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary/90"
            >
              View on GitHub
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
