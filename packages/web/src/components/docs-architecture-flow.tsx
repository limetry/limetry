/**
 * Visual evaluate-path diagram for the server architecture docs page.
 */

type FlowStage = {
  title: string
  detail: string
  tone: "client" | "server" | "decision" | "enforce"
}

const STAGES: FlowStage[] = [
  {
    title: "Client",
    detail: "Agent, SDK, CLI, MCP, or adapter drafts an ActionIntent",
    tone: "client",
  },
  {
    title: "Evaluate",
    detail: "Auth, policy registry, and action evaluator on the server",
    tone: "server",
  },
  {
    title: "Decide",
    detail: "allow, deny, or approval_required with a signed receipt",
    tone: "decision",
  },
  {
    title: "Enforce",
    detail: "Your middleware runs or skips the tool, then records outcome",
    tone: "enforce",
  },
]

const SERVER_PANELS = [
  {
    title: "Policy registry",
    detail: "Durable ActionPolicy per tenant",
  },
  {
    title: "Approval store",
    detail: "Pending rows bound to payload hash",
  },
  {
    title: "Audit store",
    detail: "Privacy-safe policy.evaluated / action.recorded",
  },
] as const

/**
 * Card surface classes by stage role.
 *
 * @param tone - Visual role of the stage.
 * @returns Tailwind class string.
 */
function stageToneClass(tone: FlowStage["tone"]): string {
  switch (tone) {
    case "client":
      return "border-border bg-muted/40"
    case "server":
      return "border-primary/40 bg-primary/10"
    case "decision":
      return "border-emerald-500/40 bg-emerald-500/10"
    case "enforce":
      return "border-border bg-card"
  }
}

/**
 * Horizontal/vertical flow of the Limetry evaluate path for docs MDX.
 *
 * @returns Accessible diagram of client → evaluate → decide → enforce.
 */
export function ArchitectureFlow(): React.JSX.Element {
  return (
    <figure
      className="not-prose my-6 overflow-hidden rounded-xl border border-border bg-gradient-to-b from-muted/50 to-background p-4 sm:p-6"
      aria-label="Limetry evaluation architecture"
    >
      <ol className="m-0 flex list-none flex-col gap-3 p-0 md:flex-row md:items-stretch md:gap-0">
        {STAGES.map((stage, index) => (
          <li key={stage.title} className="flex min-w-0 flex-1 flex-col md:flex-row md:items-stretch">
            <div
              className={[
                "flex h-full flex-1 flex-col justify-center rounded-lg border px-4 py-3 shadow-sm",
                stageToneClass(stage.tone),
              ].join(" ")}
            >
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="mt-1 text-base font-semibold text-foreground">
                {stage.title}
              </span>
              <span className="mt-1 text-sm leading-snug text-muted-foreground">
                {stage.detail}
              </span>
            </div>
            {index < STAGES.length - 1 ? (
              <div
                className="flex items-center justify-center px-0 py-1 text-primary md:px-2 md:py-0"
                aria-hidden="true"
              >
                <span className="text-lg leading-none md:hidden">↓</span>
                <span className="hidden text-lg leading-none md:inline">→</span>
              </div>
            ) : null}
          </li>
        ))}
      </ol>

      <figcaption className="mt-5 border-t border-border/70 pt-4">
        <p className="m-0 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Inside the evaluation server
        </p>
        <ul className="mt-3 m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-3">
          {SERVER_PANELS.map((panel) => (
            <li
              key={panel.title}
              className="rounded-lg border border-border/80 bg-background/80 px-3 py-3"
            >
              <span className="block text-sm font-medium text-foreground">
                {panel.title}
              </span>
              <span className="mt-1 block text-xs leading-snug text-muted-foreground">
                {panel.detail}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 mb-0 text-xs text-muted-foreground">
          Full intent is used for policy matching. Audit stores a scrubbed projection
          (<code className="rounded bg-muted px-1 py-0.5 text-[0.7rem]">minimal</code> by
          default). Optional Redis covers nonce, throttle, and JWT revocation across instances.
        </p>
      </figcaption>
    </figure>
  )
}
