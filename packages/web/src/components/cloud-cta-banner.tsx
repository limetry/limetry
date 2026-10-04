/**
 * Subtle Limetry Cloud CTA shown above the site footer on every marketing page.
 */

import Link from "next/link"

import { siteUrls } from "@/lib/site-urls"

/**
 * Bottom-of-page banner linking OSS visitors to Limetry Cloud.
 *
 * @returns Cloud CTA strip.
 */
export function CloudCtaBanner(): React.JSX.Element {
  return (
    <aside
      aria-label="Limetry Cloud"
      className="border-t border-border bg-gradient-to-br from-emerald-500/[0.08] via-card to-cyan-500/[0.08]"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-5 px-4 py-8 sm:flex-row sm:items-center sm:px-6 lg:px-8">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
            Limetry Cloud
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            Keep the same Limetry SDK, CLI, and MCP. Add organization policies, scoped agent
            tokens, an operator approval inbox, and plan-based audit retention.
          </p>
        </div>
        <Link
          href={siteUrls.app}
          className={`
            inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-xl
            bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-2.5 text-sm font-semibold
            text-white shadow-lg shadow-emerald-500/25 transition-all
            hover:-translate-y-0.5 hover:from-emerald-400 hover:to-cyan-400
            hover:shadow-emerald-500/40
          `}
        >
          Try Limetry Cloud →
        </Link>
      </div>
    </aside>
  )
}
