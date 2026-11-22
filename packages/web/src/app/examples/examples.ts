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
  anthropic: {
    slug: "anthropic",
    name: "Anthropic Claude Tool Governance",
    lang: "Python",
    framework: "limetry + Anthropic tool_use",
    maturity: "recommended",
    tested: true,
    description:
      "Intercept Anthropic tool_use blocks with the limetry Python SDK before side effects. Allow search, deny shell, approval_required on charges.",
    folder: "anthropic-claude-tool-governance",
    files: [
      { label: "README", relativePath: "README.md", language: "markdown" },
      { label: "Governance", relativePath: "governance.py", language: "python" },
      { label: "Tests", relativePath: "test_governance.py", language: "python" },
      { label: "Requirements", relativePath: "requirements.txt", language: "text" },
    ],
  },
  fastapi: {
    slug: "fastapi",
    name: "FastAPI Action Middleware Gate",
    lang: "Python",
    framework: "limetry + FastAPI",
    maturity: "recommended",
    tested: true,
    description:
      "FastAPI dependency evaluates mutating routes with limetry before handlers run. Deny → 403; approval_required → 202.",
    folder: "fastapi-action-middleware-gate",
    files: [
      { label: "README", relativePath: "README.md", language: "markdown" },
      { label: "App", relativePath: "app.py", language: "python" },
      { label: "Tests", relativePath: "test_app.py", language: "python" },
      { label: "Requirements", relativePath: "requirements.txt", language: "text" },
    ],
  },
  stripe: {
    slug: "stripe",
    name: "Stripe Payment Authorization",
    lang: "Python",
    framework: "limetry + Stripe",
    maturity: "recommended",
    tested: true,
    description:
      "Authorize Stripe charges and refunds with limetry before the Stripe API call. Deny payouts; approval_required above cost threshold.",
    folder: "stripe-python-payment-authorization",
    files: [
      { label: "README", relativePath: "README.md", language: "markdown" },
      { label: "Authorize", relativePath: "authorize.py", language: "python" },
      { label: "Tests", relativePath: "test_authorize.py", language: "python" },
      { label: "Requirements", relativePath: "requirements.txt", language: "text" },
    ],
  },
  llamaindex: {
    slug: "llamaindex",
    name: "LlamaIndex Agent Tool Firewall",
    lang: "Python",
    framework: "limetry + LlamaIndex-style tools",
    maturity: "integration",
    tested: true,
    description:
      "Wrap FunctionTool-style callables with limetry so retrieve allows and delete_index denies before the tool body runs.",
    folder: "llamaindex-agent-tool-firewall",
    files: [
      { label: "README", relativePath: "README.md", language: "markdown" },
      { label: "Firewall", relativePath: "firewall.py", language: "python" },
      { label: "Tests", relativePath: "test_firewall.py", language: "python" },
      { label: "Requirements", relativePath: "requirements.txt", language: "text" },
    ],
  },
  bedrock: {
    slug: "bedrock",
    name: "Bedrock Converse Tool Gate",
    lang: "Python",
    framework: "limetry + AWS Bedrock",
    maturity: "integration",
    tested: true,
    description:
      "After Bedrock Converse returns toolUse blocks, evaluate each tool with limetry before execution.",
    folder: "bedrock-converse-tool-gate",
    files: [
      { label: "README", relativePath: "README.md", language: "markdown" },
      { label: "Gate", relativePath: "gate.py", language: "python" },
      { label: "Tests", relativePath: "test_gate.py", language: "python" },
      { label: "Requirements", relativePath: "requirements.txt", language: "text" },
    ],
  },
  langgraph: {
    slug: "langgraph",
    name: "LangGraph Action Governance",
    lang: "Python",
    framework: "LangGraph + limetry",
    maturity: "integration",
    tested: true,
    description:
      "LangGraph StateGraph using the limetry Python SDK: upsert policy → evaluate intent → record allow/deny.",
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
    framework: "limetry (LangChain-style)",
    maturity: "simulation",
    tested: true,
    description:
      "LangChain-style provision simulation using the limetry Python SDK (no LangChain SDK dependency).",
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
    framework: "limetry (CrewAI-style)",
    maturity: "simulation",
    tested: true,
    description:
      "Researcher/Auditor/Purchaser roles evaluating purchases with the limetry Python SDK (no CrewAI SDK).",
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
    framework: "limetry (AutoGen-style)",
    maturity: "simulation",
    tested: true,
    description:
      "Broker simulation using limetry to check renewal intents (cost ceiling + merchant allowlist).",
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
