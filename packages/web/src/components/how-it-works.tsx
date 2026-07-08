"use client"

/**
 * Interactive allow / deny / approval_required vertical examples on the home page.
 */

import Link from "next/link"
import { useState } from "react"

/**
 * Evaluate outcome shown in the how-it-works cards.
 */
type Decision = "allow" | "deny" | "approval_required"

/**
 * One allow/deny/approval vignette for a vertical.
 */
type DecisionCase = {
  decision: Decision
  title: string
  body: string
}

/**
 * Agent vertical with three outcome examples.
 */
type VerticalExample = {
  id: string
  label: string
  agent: string
  href: string
  cases: DecisionCase[]
}

const VERTICALS: VerticalExample[] = [
  {
    id: "ci",
    label: "GitHub Actions",
    agent: "Copilot coding agent",
    href: "/examples/ci",
    cases: [
      {
        decision: "allow",
        title: "PR typecheck",
        body: "Copilot calls run_ci_privilege. Limetry allows ci_privilege so tests run. Deploy secrets stay unavailable.",
      },
      {
        decision: "deny",
        title: "Fork production deploy",
        body: "request_production_deploy on pull_request is untrusted. Limetry evaluates, records deny, then require_trusted fails closed before production credentials load.",
      },
      {
        decision: "approval_required",
        title: "Main production deploy",
        body: "Trusted push to main still returns approval_required. The coding agent prints approval_id and exits closed.",
      },
    ],
  },
  {
    id: "shopify",
    label: "Shopify support",
    agent: "Support / ops agent",
    href: "/examples/shopify",
    cases: [
      {
        decision: "allow",
        title: "$10 goodwill refund",
        body: "issue_customer_refund under $25 evaluates shopify.refund and executes. The agent never holds SHOPIFY_ADMIN_TOKEN.",
      },
      {
        decision: "deny",
        title: "Inventory wipe",
        body: "set_inventory_level is denied. This is a support agent, not a warehouse console — Admin API is never called.",
      },
      {
        decision: "approval_required",
        title: "$25 damaged-item refund",
        body: "Amount meets approval_cost_minor. executed stays false until an operator signs off via the approval API.",
      },
    ],
  },
  {
    id: "sql",
    label: "SQL",
    agent: "Cursor / Claude DB tool",
    href: "/examples/sql",
    cases: [
      {
        decision: "allow",
        title: "SELECT recent rows",
        body: "limetry_sql_query classifies sql.read, allows, and returns rows. DATABASE_URL never leaves the MCP process.",
      },
      {
        decision: "deny",
        title: "DROP TABLE",
        body: "DDL is denied before the database sees it. The agent must not open a direct SQL console to bypass the tool.",
      },
      {
        decision: "approval_required",
        title: "INSERT a user",
        body: "sql.write waits. limetry_sql_list_pending surfaces approval_id. This is a query tool, not a DBA console.",
      },
    ],
  },
]

const DECISION_STYLES: Record<Decision, { label: string; className: string }> = {
  allow: {
    label: "allow",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  deny: {
    label: "deny",
    className: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400",
  },
  approval_required: {
    label: "approval required",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-400",
  },
}

/**
 * Vertical picker illustrating allow / deny / approval_required outcomes.
 *
 * @returns How-it-works section.
 */
export function HowItWorks(): React.JSX.Element {
  const [activeId, setActiveId] = useState(VERTICALS[0]!.id)
  const active = VERTICALS.find((vertical) => vertical.id === activeId) ?? VERTICALS[0]!

  return (
    <section className="py-20 sm:py-28" id="how-it-works">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">How it works</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            Every tool call gets an outcome
          </h2>
          <p className="mt-4 text-muted-foreground">
            The same evaluate path works for any irreversible tool. These loops show allow, deny,
            or wait before the side effect runs.
          </p>
        </div>

        <div className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-2">
          {VERTICALS.map((vertical) => {
            const selected = vertical.id === active.id
            return (
              <button
                key={vertical.id}
                type="button"
                onClick={() => setActiveId(vertical.id)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {vertical.label}
              </button>
            )
          })}
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Agent surface: <span className="font-semibold text-foreground">{active.agent}</span>
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {active.cases.map((item) => {
            const style = DECISION_STYLES[item.decision]
            return (
              <article
                key={item.title}
                className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm"
              >
                <span className={`w-fit rounded-full border px-2.5 py-0.5 text-xs font-semibold ${style.className}`}>
                  {style.label}
                </span>
                <h3 className="mt-4 font-bold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </article>
            )
          })}
        </div>

        <div className="mt-10 text-center">
          <Link
            href={active.href}
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80"
          >
            Open the {active.label} example
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}
