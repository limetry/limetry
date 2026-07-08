/**
 * Marketing hero with rotating blurb, CTAs, and evaluate sample snippet.
 */

import Link from "next/link"

import { IconAccent } from "@/components/brand"
import { RotatingHeroBlurb } from "@/components/rotating-hero-blurb"
import { siteUrls } from "@/lib/site-urls"

const BADGE_CODE = `import { createRemoteEngine } from "@limetry/sdk"

const engine = createRemoteEngine({
  baseUrl: process.env.LIMETRY_BASE_URL,
  apiKey: process.env.LIMETRY_BEARER_TOKEN,
})

const decision = await engine.evaluateAction({
  intent_id: crypto.randomUUID(),
  policy_id: policyId,
  agent_id: "ci-bot",
  action_type: "deploy",
  resource: "github.com/acme/api@abc123",
  issued_at: new Date().toISOString(),
})

if (!decision.ok || !decision.approved) {
  throw new Error((decision.reasons ?? ["denied"]).join("; "))
}`

/**
 * Primary marketing hero with CTAs and an evaluate code sample.
 *
 * @returns Hero section.
 */
export function Hero(): React.JSX.Element {
  return (
    <section className="relative overflow-hidden gradient-mesh">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-0 h-150 w-150 rounded-full bg-primary/10 blur-3xl animate-pulse-slow"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 bottom-0 h-125 w-125 rounded-full bg-cyan-500/8 blur-3xl animate-pulse-slow"
        style={{ animationDelay: "1.5s" }}
      />
      <IconAccent className="-right-32 -top-32 h-120 w-120 opacity-[0.06] rotate-12" />

      <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-20 sm:px-6 sm:pb-32 sm:pt-28 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Evaluate · deny · audit before irreversible tools run
          </div>

          <RotatingHeroBlurb />

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/docs/quick-start"
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
            >
              Install in 5 minutes
              <ArrowRightIcon />
            </Link>
            <Link
              href="/examples"
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl border border-border bg-background px-6 py-3 text-base font-semibold text-foreground shadow-sm transition-all hover:bg-muted hover:shadow-md"
            >
              Browse examples
            </Link>
            <Link
              href={siteUrls.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl border border-border bg-background px-6 py-3 text-base font-semibold text-foreground shadow-sm transition-all hover:bg-muted hover:shadow-md"
            >
              <GitHubStarIcon />
              Star on GitHub
            </Link>
          </div>

          <div className="mt-14 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
            {[
              { label: "in the agent loop", value: "Evaluate" },
              { label: "with reasons + receipts", value: "Deny" },
              { label: "privacy-safe records", value: "Audit" },
              { label: "allow · deny · wait", value: "Outcomes" },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center gap-0.5">
                <span className="text-2xl font-black text-foreground">{stat.value}</span>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-14 max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/10">
            <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-red-400" />
              <span className="h-3 w-3 rounded-full bg-yellow-400" />
              <span className="h-3 w-3 rounded-full bg-green-400" />
              <span className="ml-3 font-mono text-xs text-muted-foreground">evaluate.ts</span>
            </div>
            <pre className="overflow-x-auto border-none bg-transparent p-5 text-left text-sm leading-relaxed">
              <code className="text-foreground/90">{BADGE_CODE}</code>
            </pre>
          </div>

          <p className="mx-auto mt-8 max-w-xl text-center text-xs leading-relaxed text-muted-foreground">
            Open-source MCP, CLI, and Limetry SDK. Policy checks run on the
            self-run server. Audit stores privacy-safe records by default — see data
            minimization docs.
          </p>
        </div>
      </div>
    </section>
  )
}

function ArrowRightIcon(): React.JSX.Element {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  )
}

function GitHubStarIcon(): React.JSX.Element {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 3.02a1 1 0 00-.364 1.118l1.52 4.674c.3.922-.755 1.688-1.539 1.118l-3.976-3.019a1 1 0 00-1.176 0l-3.976 3.019c-.784.57-1.838-.196-1.539-1.118l1.52-4.674a1 1 0 00-.364-1.118L2.98 10.1c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  )
}
