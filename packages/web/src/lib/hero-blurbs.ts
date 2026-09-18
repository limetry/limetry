/**
 * Rotating hero headline copy for limetry.com (open source).
 * Twenty-five options ranked with developer experience as first priority, enterprise capabilities as second.
 * Strictly avoids acronyms and external brand names.
 */

/**
 * Structured hero blurb: prefix, emphasized line, and supporting highlight.
 */
export type HeroBlurbPart = {
  emphasis: string
  highlight: string
  prefix: string
}

/**
 * Ranked hero blurbs for open-source Limetry (twenty-five options).
 * - Ranks 1 to 5 (indices 0 to 4): Developer experience first priority.
 * - Ranks 6 to 15 (indices 5 to 14): Middle tier safety, simulation, and observability.
 * - Ranks 16 to 25 (indices 15 to 24): Enterprise capabilities in open source.
 */
export const HERO_BLURB_PARTS: HeroBlurbPart[] = [
  // 1 to 5: Top tier (Developer experience priority)
  {
    prefix: "Stop irreversible agent",
    emphasis: "side effects cold.",
    highlight:
      "Check the action before the tool runs. Outcomes: allow, deny, or wait for a human — then a privacy-safe audit trail.",
  },
  {
    prefix: "Policy in the path,",
    emphasis: "not in the prompt.",
    highlight:
      "Signed outcome receipts. Enforce deny in middleware and MCP hosts — never in prompt text.",
  },
  {
    prefix: "One policy check.",
    emphasis: "Every agent loop.",
    highlight:
      "Limetry SDK, CLI, and MCP share the same action intent shape. Pick an example that matches your stack and extend from there.",
  },
  {
    prefix: "Drop-in action governance",
    emphasis: "in under five minutes.",
    highlight:
      "A single client function intercepts dangerous tool calls before side effects happen. No architecture rewrite required.",
  },
  {
    prefix: "Zero network latency,",
    emphasis: "in-process evaluation.",
    highlight:
      "Policy decisions run microsecond-fast directly inside your application runtime, eliminating extra network round-trips.",
  },
  {
    prefix: "Policy as code,",
    emphasis: "typed and versioned.",
    highlight:
      "Define action boundaries in your favorite programming language. Track rules in version control and test them during automated builds.",
  },
  {
    prefix: "One unified contract",
    emphasis: "across your entire agent stack.",
    highlight:
      "Enforce consistent guardrails whether an agent runs in a local terminal, a browser session, or behind an agent tool server.",
  },
  {
    prefix: "Predictable outcomes,",
    emphasis: "zero unexpected permissions.",
    highlight:
      "Every check resolves deterministically to allow, deny, or review. Never guess what an autonomous tool call will attempt.",
  },

  // 6 to 15: Middle tier (Developer experience, safety, and testing)
  {
    prefix: "Simulate policy changes",
    emphasis: "before production rollout.",
    highlight:
      "Dry-run proposed rule adjustments against recorded action histories to spot breaking changes before shipping.",
  },
  {
    prefix: "Instant kill switch,",
    emphasis: "zero service redeployment.",
    highlight:
      "Block rogue tools or restrict compromised agents dynamically without restarting server containers or redeploying code.",
  },
  {
    prefix: "Scoped agent tokens,",
    emphasis: "never master credentials.",
    highlight:
      "Issue short-lived, task-bounded access keys with strict time limits and action whitelists so credentials never leak.",
  },
  {
    prefix: "Complete runtime visibility",
    emphasis: "into every decision.",
    highlight:
      "Track evaluation speed, approval bottlenecks, and allow versus deny ratios in real time with structured event metrics.",
  },
  {
    prefix: "Local-first testing,",
    emphasis: "offline and automated.",
    highlight:
      "Execute your entire policy test suite on your developer workstation with zero external cloud dependencies.",
  },
  {
    prefix: "Granular data masking",
    emphasis: "before storage.",
    highlight:
      "Scrub confidential user identifiers and secret keys before actions get recorded in local audit trails.",
  },
  {
    prefix: "Framework flexibility",
    emphasis: "built for any stack.",
    highlight:
      "Seamlessly protect agent loops built with custom orchestration frameworks or standard model interfaces.",
  },
  {
    prefix: "Transparent decision traces",
    emphasis: "for rapid debugging.",
    highlight:
      "Inspect exact rule matches, input variables, and evaluation timelines directly inside your development terminal.",
  },
  {
    prefix: "Declarative guardrails",
    emphasis: "without code clutter.",
    highlight:
      "Keep application logic clean by decoupling security policies from your core business routines and model prompts.",
  },
  {
    prefix: "Zero vendor lock-in,",
    emphasis: "freely open source.",
    highlight:
      "Run the governance node on your own hardware or private infrastructure with complete control over your code.",
  },

  // 16 to 25: Bottom tier (Enterprise capabilities available in open source)
  {
    prefix: "Tamper-evident audit",
    emphasis: "on your own machines.",
    highlight:
      "Generate cryptographically signed, immutable records stored directly inside your own relational database or object storage.",
  },
  {
    prefix: "Auditor-ready logs",
    emphasis: "for compliance reviews.",
    highlight:
      "Export sanitized decision histories in structured formats designed specifically for external security evaluations.",
  },
  {
    prefix: "Multi-tenant boundaries",
    emphasis: "within a single deployment.",
    highlight:
      "Isolate customer policies and agent execution contexts cleanly across workspaces without maintaining separate infrastructure.",
  },
  {
    prefix: "Seamless hosted upgrade",
    emphasis: "when you need a team portal.",
    highlight:
      "Transition from a local node to our hosted control plane for collaborative team reviews without changing your client code.",
  },
  {
    prefix: "Air-gapped deployment",
    emphasis: "for private networks.",
    highlight:
      "Operate completely disconnected from the public internet to satisfy strict defense, banking, and healthcare regulations.",
  },
  {
    prefix: "Role-based separation",
    emphasis: "between teams.",
    highlight:
      "Allow security engineers to author policies while software developers build autonomous features within defined guardrails.",
  },
  {
    prefix: "High-throughput scaling",
    emphasis: "tested under extreme load.",
    highlight:
      "Minimal memory overhead and efficient compiled rules sustain high request volumes under demanding workloads.",
  },
  {
    prefix: "Custom policy extensions",
    emphasis: "for proprietary logic.",
    highlight:
      "Write bespoke evaluation handlers in your programming language of choice to consult internal risk services before allowing actions.",
  },
  {
    prefix: "Automated secret scrubbing",
    emphasis: "in every audit trail.",
    highlight:
      "Ensure recorded histories remain privacy-safe by never saving authorization headers, passwords, or raw user prompts to disk.",
  },
  {
    prefix: "Enterprise-grade stability",
    emphasis: "proven in production.",
    highlight:
      "Rely on an open architecture designed from the ground up to protect mission-critical automated workflows.",
  },
]

/**
 * Flat headline strings derived from {@link HERO_BLURB_PARTS}.
 */
export const HERO_BLURBS = HERO_BLURB_PARTS.map(
  (part) => `${part.prefix} ${part.emphasis}`,
) as readonly string[]

/**
 * Rotation interval for the hero blurb animation (milliseconds).
 */
export const HERO_ROTATE_MS = 4500

/**
 * Returns an active rotation batch of 5 blurbs:
 * - 2 from top-5 (indices 0 to 4)
 * - 2 from middle 6 to 15 (indices 5 to 14)
 * - 1 from bottom 16 to 25 (indices 15 to 24)
 *
 * @param rotationCycle - Sequential cycle counter (0, 1, 2, ...).
 * @returns Array of exactly 5 blurb parts.
 */
export function getHeroRotationBatch(rotationCycle = 0): HeroBlurbPart[] {
  const topPool = HERO_BLURB_PARTS.slice(0, 5)
  const midPool = HERO_BLURB_PARTS.slice(5, 15)
  const botPool = HERO_BLURB_PARTS.slice(15, 25)

  const top1 = topPool[(rotationCycle * 2) % topPool.length] ?? topPool[0]
  const top2 = topPool[(rotationCycle * 2 + 1) % topPool.length] ?? topPool[1]
  const mid1 = midPool[(rotationCycle * 2) % midPool.length] ?? midPool[0]
  const mid2 = midPool[(rotationCycle * 2 + 1) % midPool.length] ?? midPool[1]
  const bot1 = botPool[rotationCycle % botPool.length] ?? botPool[0]

  return [top1, top2, mid1, mid2, bot1]
}
