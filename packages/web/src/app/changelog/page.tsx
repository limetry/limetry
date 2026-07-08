/**
 * Public changelog of notable Limetry package and site releases.
 */

import type { Metadata } from "next"

import { IconAccent } from "@/components/brand"
import { Footer } from "@/components/footer"
import { SiteHeader } from "@/components/site-header"

/**
 * Changelog page SEO metadata.
 */
export const metadata: Metadata = {
  title: "Changelog",
  description:
    "Notable Limetry releases across the SDK, CLI, evaluation server, and MCP packages.",
}

/**
 * One public changelog row.
 */
interface ChangelogEntry {
  date: string
  title: string
  tag: "Feature" | "Fix" | "Docs" | "Infra"
  description: string
}

const ENTRIES: ChangelogEntry[] = [
  {
    date: "July 16, 2026",
    title: "Public website: docs, blog, examples, and pricing",
    tag: "Feature",
    description: "Launched limetry.com with Fumadocs-powered documentation, an engineering blog, a browsable example gallery, and community and pricing pages.",
  },
  {
    date: "July 15, 2026",
    title: "@limetry/ui published to npm",
    tag: "Feature",
    description: "The shared UI component library is now published publicly, with pinned dependency versions and tightened peer dependency ranges across the monorepo.",
  },
  {
    date: "July 9, 2026",
    title: "USAGE.md integration guide",
    tag: "Docs",
    description: "Published USAGE.md: install the SDK, evaluate policies, enforce outcomes, and query privacy-safe audit.",
  },
  {
    date: "July 5, 2026",
    title: "Continuous integration pipeline",
    tag: "Infra",
    description: "Added GitHub Actions running SDK tests and a smoke test across integration examples on every push.",
  },
  {
    date: "July 2, 2026",
    title: "Tighter public SDK types",
    tag: "Fix",
    description: "Tighter TypeScript definitions, JSDoc on the public API, and broader ESLint coverage.",
  },
  {
    date: "June 28, 2026",
    title: "AI agent skill plugin",
    tag: "Feature",
    description: "Added a Gemini / Antigravity agent skill so coding agents can find and call Limetry evaluate.",
  },
  {
    date: "June 11, 2026",
    title: "@limetry/mcp — MCP server",
    tag: "Feature",
    description: "New Model Context Protocol server that brings policy evaluation and audit tools to Claude, Cursor, and Copilot.",
  },
  {
    date: "May 24 – June 25, 2026",
    title: "Integration examples",
    tag: "Feature",
    description: "Shipped examples for OpenAI, LangChain, AI SDK agent loops, CrewAI, AutoGen, Slack bots, ChatGPT Custom GPTs, and related agent stacks.",
  },
  {
    date: "May 14, 2026",
    title: "@limetry/cli",
    tag: "Feature",
    description: "New CLI with limetry setup, token, and auth subcommands for provisioning projects and credentials from the terminal.",
  },
  {
    date: "May 12, 2026",
    title: "Self-run evaluation server",
    tag: "Feature",
    description: "Open-source evaluation server for remote policy evaluation and audit, plus the Limetry SDK for HTTP evaluate against a Limetry server.",
  },
  {
    date: "April 24, 2026",
    title: "TypeScript SDK",
    tag: "Feature",
    description: "Scaffolded @limetry/sdk with the Limetry SDK, action intent helpers, and typed evaluate errors.",
  },
  {
    date: "April 14 – 21, 2026",
    title: "Action policy evaluate",
    tag: "Feature",
    description: "Initial release: check action intents against action policy (types, resource patterns, optional cost caps), privacy-safe audit, and signed outcome receipts.",
  },
]

const TAG_COLORS: Record<ChangelogEntry["tag"], string> = {
  Feature: "bg-primary/10 text-primary border-primary/20",
  Fix: "bg-red-500/10 text-red-400 border-red-500/20",
  Docs: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Infra: "bg-purple-500/10 text-purple-400 border-purple-500/20",
}

/**
 * Renders the public changelog timeline.
 *
 * @returns Changelog page layout.
 */
export default function ChangelogPage(): React.JSX.Element {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="relative flex-1 overflow-hidden py-16 sm:py-24">
        <IconAccent className="-right-48 top-24 h-[460px] w-[460px] opacity-[0.05] rotate-6" />
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">Changelog</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
              What&apos;s new in Limetry
            </h1>
            <p className="mt-3 text-muted-foreground">
              Notable releases across the TypeScript SDK, CLI, evaluation server, and MCP packages.
            </p>
          </div>

          <ol className="relative border-l border-border pl-6">
            {ENTRIES.map((entry) => (
              <li key={`${entry.date}-${entry.title}`} className="mb-10 last:mb-0">
                <span className="absolute -left-[5px] mt-2 h-2.5 w-2.5 rounded-full bg-primary" aria-hidden="true" />
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-lg border px-2.5 py-0.5 text-xs font-semibold ${TAG_COLORS[entry.tag]}`}
                  >
                    {entry.tag}
                  </span>
                  <time className="text-xs text-muted-foreground">{entry.date}</time>
                </div>
                <h2 className="mt-2 text-lg font-bold text-foreground">{entry.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{entry.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </main>
      <Footer />
    </div>
  )
}
