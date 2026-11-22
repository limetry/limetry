/**
 * Home-page grid of primary framework example links.
 */

import Link from "next/link"

const PRIMARY = [
  { name: "GitHub Actions + Copilot", lang: "TypeScript", maturity: "Allow · deny · approval", href: "/examples/ci" },
  { name: "Shopify support / ops agent", lang: "TypeScript", maturity: "Allow · deny · approval", href: "/examples/shopify" },
  { name: "Cursor / Claude SQL tool", lang: "TypeScript", maturity: "Allow · deny · approval", href: "/examples/sql" },
  { name: "OpenAI Procurement Agent", lang: "TypeScript", maturity: "Recommended", href: "/examples/openai" },
  { name: "Anthropic Claude tool gate", lang: "Python", maturity: "Recommended", href: "/examples/anthropic" },
  { name: "FastAPI action middleware", lang: "Python", maturity: "Recommended", href: "/examples/fastapi" },
  { name: "Stripe payment authorization", lang: "Python", maturity: "Recommended", href: "/examples/stripe" },
  { name: "Serverless Slack Cost Control", lang: "TypeScript", maturity: "Integration", href: "/examples/slack" },
  { name: "LangGraph Action Governance", lang: "Python", maturity: "Integration", href: "/examples/langgraph" },
  { name: "LlamaIndex tool firewall", lang: "Python", maturity: "Integration", href: "/examples/llamaindex" },
  { name: "Bedrock Converse tool gate", lang: "Python", maturity: "Integration", href: "/examples/bedrock" },
  { name: "LangChain-style Governance", lang: "Python", maturity: "Simulation", href: "/examples/langchain" },
  { name: "CrewAI-style Approvals", lang: "Python", maturity: "Simulation", href: "/examples/crewai" },
  { name: "AutoGen-style Renewal Broker", lang: "Python", maturity: "Simulation", href: "/examples/autogen" },
  { name: "ChatGPT GPT Actions Schema", lang: "YAML / JSON", maturity: "Schema", href: "/examples/chatgpt" },
]

const LANG_COLORS: Record<string, string> = {
  TypeScript: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Python: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  "YAML / JSON": "bg-purple-500/10 text-purple-400 border-purple-500/20",
}

/**
 * Renders the home-page primary examples link grid.
 *
 * @returns Examples section element.
 */
export function ExamplesGrid(): React.JSX.Element {
  return (
    <section className="py-20 sm:py-28" id="examples">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold tracking-widest text-primary uppercase">Examples</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            Where teams put Limetry in the path
          </h2>
          <p className="mt-4 text-muted-foreground">
            Reference integrations for CI, Shopify, SQL, and common agent frameworks. Each uses the
            same evaluate API — add your own adapter when you need a new surface.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PRIMARY.map((ex) => (
            <Link
              key={ex.name}
              href={ex.href}
              className="
                group flex items-center justify-between rounded-2xl border border-border bg-card p-5
                shadow-sm transition-all
                hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md
              "
            >
              <div>
                <p className="
                  font-semibold text-foreground transition-colors
                  group-hover:text-primary
                ">{ex.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{ex.maturity}</p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-lg border px-2 py-0.5 text-xs font-semibold ${LANG_COLORS[ex.lang] ?? `
                    border-border bg-muted text-muted-foreground
                  `}`}
                >
                  {ex.lang}
                </span>
                <svg
                  className="
                    size-4 text-muted-foreground transition-all
                    group-hover:translate-x-0.5 group-hover:text-primary
                  "
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/examples"
            className="
              inline-flex items-center gap-2 rounded-xl border border-border bg-background px-6 py-3
              text-sm font-semibold whitespace-nowrap text-foreground shadow-sm transition-all
              hover:bg-muted hover:shadow-md
            "
          >
            Browse all examples
          </Link>
        </div>
      </div>
    </section>
  )
}
