/**
 * Catalog of framework example pages under `/examples`.
 */

/**
 * Descriptor for one example detail page and its source files.
 */
export interface ExampleConfig {
  slug: string
  name: string
  lang: string
  framework: string
  description: string
  maturity: "recommended" | "integration" | "simulation" | "reference"
  tested: boolean
  folder: string
  files: {
    label: string
    relativePath: string
    language: string
  }[]
}

/**
 * Example slug → config map used by `/examples` routes and search indexing.
 */
export const EXAMPLES: Record<string, ExampleConfig> = {
  ci: {
    slug: "ci",
    name: "GitHub Actions + Copilot CI Gate",
    lang: "TypeScript",
    framework: "@limetry/ci",
    maturity: "recommended",
    tested: true,
    description:
      "Twelve Copilot PRs can share a job with configure-cloud-credentials. @limetry/ci evaluates ci_privilege vs deploy before production credentials load: allow tests, deny untrusted deploys, approval_required on main. Resource is owner/repo@sha.",
    folder: "github-actions-ci-gate",
    files: [
      { label: "README", relativePath: "README.md", language: "markdown" },
      { label: "Copilot skill", relativePath: "SKILL.md", language: "markdown" },
      { label: "Copilot instructions", relativePath: "copilot-instructions.md", language: "markdown" },
      { label: "Coding agent tools", relativePath: "src/coding-agent.ts", language: "typescript" },
      { label: "Workflow Guard", relativePath: "src/workflow-guard.ts", language: "typescript" },
      { label: "Coding agent workflow", relativePath: "coding-agent-workflow.yml", language: "yaml" },
      { label: "CI Gate Tests", relativePath: "tests/ci-gate.spec.ts", language: "typescript" },
    ],
  },
  shopify: {
    slug: "shopify",
    name: "Shopify Support / Ops Agent",
    lang: "TypeScript",
    framework: "@limetry/shopify",
    maturity: "recommended",
    tested: true,
    description:
      "Built after a support agent batch-refunded $3,200 in two minutes with no approval. Mutation firewall in the runtime (not a Shopify App): allow $10 refunds, deny inventory wipes, approval_required at $25. Admin token stays in the firewall.",
    folder: "shopify-mutation-firewall",
    files: [
      { label: "README", relativePath: "README.md", language: "markdown" },
      { label: "Support agent skill", relativePath: "SKILL.md", language: "markdown" },
      { label: "Ops agent tools", relativePath: "src/support-ops-agent.ts", language: "typescript" },
      { label: "Firewall factory", relativePath: "src/agent-support.ts", language: "typescript" },
      { label: "Store Policy", relativePath: "src/policy.ts", language: "typescript" },
      { label: "Firewall Tests", relativePath: "tests/firewall.spec.ts", language: "typescript" },
    ],
  },
  sql: {
    slug: "sql",
    name: "Cursor / Claude SQL DB Tool",
    lang: "TypeScript",
    framework: "@limetry/sql",
    maturity: "recommended",
    tested: true,
    description:
      "Created after a Cursor user lost 1,847 production accounts to a DELETE with a bad regex. The gate owns DATABASE_URL so the agent never holds write credentials. Allow SELECT, deny DROP, approval_required for INSERT against SQL databases.",
    folder: "mcp-sql-write-gate",
    files: [
      { label: "README", relativePath: "README.md", language: "markdown" },
      { label: "Cursor / Claude skill", relativePath: "SKILL.md", language: "markdown" },
      { label: "Cursor MCP config", relativePath: "cursor-mcp.json", language: "json" },
      { label: "Claude Desktop config", relativePath: "claude_desktop_config.json", language: "json" },
      { label: "Agent DB tool", relativePath: "src/cursor-db-tool.ts", language: "typescript" },
      { label: "Gate Tests", relativePath: "tests/gate.spec.ts", language: "typescript" },
    ],
  },
  openai: {
    slug: "openai",
    name: "OpenAI Agent Governance",
    lang: "TypeScript",
    framework: "OpenAI SDK",
    maturity: "recommended",
    tested: true,
    description:
      "Intercepts tool calls and runs Limetry policy before side effects. Includes action intent helpers with auditMode minimal and redactDetails.",
    folder: "openai-agent-procurement-governance",
    files: [
      { label: "README", relativePath: "README.md", language: "markdown" },
      { label: "Action Governance", relativePath: "src/action-governance.ts", language: "typescript" },
      { label: "Governance Tests", relativePath: "tests/action-governance.spec.ts", language: "typescript" },
      { label: "Package Config", relativePath: "package.json", language: "json" },
    ],
  },
  slack: {
    slug: "slack",
    name: "Slack Cost Control",
    lang: "TypeScript",
    framework: "server function / Slack",
    maturity: "integration",
    tested: true,
    description:
      "Slack slash-command handler that evaluates cloud cost intents with Limetry (mocked unit tests).",
    folder: "serverless-slack-aws-cost-control",
    files: [
      { label: "README", relativePath: "README.md", language: "markdown" },
      { label: "Handler", relativePath: "src/handler.ts", language: "typescript" },
      { label: "Cost Policy", relativePath: "src/policy.ts", language: "typescript" },
      { label: "Handler Tests", relativePath: "tests/handler.spec.ts", language: "typescript" },
      { label: "Package Config", relativePath: "package.json", language: "json" },
    ],
  },
  langgraph: {
    slug: "langgraph",
    name: "LangGraph Action Governance",
    lang: "Python",
    framework: "LangGraph",
    maturity: "integration",
    tested: true,
    description:
      "LangGraph StateGraph: upsert action policy → check action intent → record allow/deny.",
    folder: "langgraph-agent-payment-authorization",
    files: [
      { label: "README", relativePath: "README.md", language: "markdown" },
      { label: "StateGraph Action Flow", relativePath: "graph.py", language: "python" },
      { label: "Graph Tests", relativePath: "test_graph.py", language: "python" },
      { label: "Requirements", relativePath: "requirements.txt", language: "text" },
    ],
  },
  langchain: {
    slug: "langchain",
    name: "LangChain-style Governance",
    lang: "Python",
    framework: "LangChain-style HTTP",
    maturity: "simulation",
    tested: true,
    description:
      "Plain-Python HTTP client that upserts an action policy and checks provision intents (no LangChain SDK).",
    folder: "python-agent-langchain-governance",
    files: [
      { label: "README", relativePath: "README.md", language: "markdown" },
      { label: "Agent Script", relativePath: "agent.py", language: "python" },
      { label: "Agent Tests", relativePath: "test_agent.py", language: "python" },
      { label: "Requirements", relativePath: "requirements.txt", language: "text" },
    ],
  },
  crewai: {
    slug: "crewai",
    name: "CrewAI-style Multi-Agent Governance",
    lang: "Python",
    framework: "CrewAI-style simulation",
    maturity: "simulation",
    tested: true,
    description:
      "Researcher/Auditor/Purchaser roles calling Limetry evaluate over HTTP (no CrewAI SDK dependency).",
    folder: "crewai-multi-agent-financial-approvals",
    files: [
      { label: "README", relativePath: "README.md", language: "markdown" },
      { label: "Crew Agents", relativePath: "crew.py", language: "python" },
      { label: "Crew Tests", relativePath: "test_crew.py", language: "python" },
    ],
  },
  autogen: {
    slug: "autogen",
    name: "AutoGen-style renewal broker",
    lang: "Python",
    framework: "AutoGen-style simulation",
    maturity: "simulation",
    tested: true,
    description:
      "Broker simulation that checks renewal action intents (cost ceiling + merchant allowlist).",
    folder: "autogen-saas-broker-nonce-deduplication",
    files: [
      { label: "README", relativePath: "README.md", language: "markdown" },
      { label: "Broker Script", relativePath: "autogen_broker.py", language: "python" },
      { label: "Broker Tests", relativePath: "test_broker.py", language: "python" },
    ],
  },
  chatgpt: {
    slug: "chatgpt",
    name: "ChatGPT Custom GPT Actions",
    lang: "YAML / JSON",
    framework: "Custom GPT Actions",
    maturity: "simulation",
    tested: false,
    description:
      "OpenAPI schema for upsert/evaluate/record/audit. Minimal audit; does not put secrets in metadata.",
    folder: "chatgpt-custom-gpt-payment-governance",
    files: [
      { label: "README", relativePath: "README.md", language: "markdown" },
      { label: "OpenAPI Specification", relativePath: "openapi.json", language: "json" },
    ],
  },
}

/**
 * Groups {@link EXAMPLES} by maturity for the gallery page.
 *
 * @returns Recommended, integration/simulation, and reference lists.
 */
export function examplesByCategory(): {
  recommended: ExampleConfig[]
  integrations: ExampleConfig[]
  references: ExampleConfig[]
  } {
  const all = Object.values(EXAMPLES)
  return {
    recommended: all.filter((example) => example.maturity === "recommended"),
    integrations: all.filter((example) => example.maturity === "integration" || example.maturity === "simulation"),
    references: all.filter((example) => example.maturity === "reference"),
  }
}
