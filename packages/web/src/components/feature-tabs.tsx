"use client"

/**
 * Home-page SDK / CLI / MCP / server feature tabs with sample snippets.
 */

import Link from "next/link"
import { useState } from "react"

const TABS = [
  {
    id: "sdk",
    label: "SDK",
    headline: "Evaluate before the tool runs.",
    description:
      "Call createRemoteEngine().evaluateAction from any agent loop or adapter. Every evaluation returns an outcome — allow, deny, or wait — plus reasons and a signed receipt. The server requires intent_id (UUID) and issued_at.",
    cta: { label: "Read SDK docs", href: "/docs/sdk" },
    code: `import { createRemoteEngine } from "@limetry/sdk"

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
}`,
  },
  {
    id: "cli",
    label: "CLI",
    headline: "Policies your org can apply in CI.",
    description:
      "Define allowed and denied action types, resource patterns, and optional cost caps. Policies are versioned on the server and evaluated the same way from CLI, SDK, and MCP.",
    cta: { label: "Quickstart guide", href: "/docs/quick-start" },
    code: `limetry policy apply \\
  --allow http_get \\
  --deny deploy \\
  --block-resource "github.com/acme/*"

echo '{
  "policy_id": "PASTE_POLICY_ID",
  "action_type": "deploy",
  "resource": "github.com/acme/api@abc123"
}' | limetry eval`,
  },
  {
    id: "mcp",
    label: "MCP",
    headline: "Evaluate from the editor.",
    description:
      "Wire the MCP server into Cursor or Claude. Record executed, skipped, or blocked outcomes after each policy check. Tail the audit trail (minimal by default).",
    cta: { label: "MCP integration", href: "/docs/mcp" },
    code: `# MCP tools (Cursor / Claude Desktop)
limetry_evaluate      # check an action intent
limetry_record_action # log executed / skipped / blocked
limetry_list_audit    # tail policy.evaluated events
limetry_upsert_policy # create or update action policy`,
  },
  {
    id: "server",
    label: "Server",
    headline: "Run the evaluation server yourself.",
    description:
      "Run the evaluation server locally or on your own machines. Point the Limetry SDK, CLI, and MCP package at that node. You own retention, keys, and uptime.",
    cta: { label: "Self-run guide", href: "/docs/server/self-hosting" },
    code: `# Start a local node
LIMETRY_BEARER_TOKEN="your-secure-token-min-32-chars" \\
  yarn workspace @limetry/server start`,
  },
]

/**
 * Tabbed SDK / CLI / MCP / server feature showcase for the home page.
 *
 * @returns Feature tabs section.
 */
export function FeatureTabs(): React.JSX.Element {
  const [active, setActive] = useState("sdk")
  const tab = TABS.find((t) => t.id === active) ?? TABS[0]!

  return (
    <section className="border-t border-border bg-muted/30 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Same policy API everywhere</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            Check once. Enforce everywhere.
          </h2>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={`whitespace-nowrap rounded-lg px-5 py-2 text-sm font-semibold transition-all ${
                active === t.id
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-background border border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div key={active} className="mt-10 grid grid-cols-1 gap-8 animate-fade-in lg:grid-cols-2 lg:items-center">
          <div>
            <h3 className="text-2xl font-black text-foreground">{tab.headline}</h3>
            <p className="mt-4 text-muted-foreground leading-relaxed">{tab.description}</p>
            <Link
              href={tab.cta.href}
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              {tab.cta.label}
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
            <div className="flex items-center gap-2 border-b border-border bg-muted/60 px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
            </div>
            <pre className="overflow-x-auto border-none bg-transparent p-5 text-sm leading-relaxed">
              <code className="text-foreground/85 font-mono">{tab.code}</code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  )
}
