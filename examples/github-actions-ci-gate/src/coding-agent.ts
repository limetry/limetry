import { classifyEventTrust } from "@limetry/ci"

import { guardDeploymentWorkflow, type GuardWorkflowResult } from "./workflow-guard.js"

export type CodingAgentToolName = "run_ci_privilege" | "request_production_deploy"

export type CodingAgentToolParameter = {
  type: "string"
  description: string
}

export type CodingAgentToolDefinition = {
  type: "function"
  function: {
    name: CodingAgentToolName
    description: string
    parameters: {
      type: "object"
      properties: Record<string, CodingAgentToolParameter>
      required: string[]
    }
  }
}

export type CodingAgentContext = {
  eventName: string
  ref?: string
  repository: string
  sha: string
  apiKey: string
  baseUrl?: string
  fetch?: typeof globalThis.fetch
}

export type CodingAgentToolArgs = {
  eventName?: string
  ref?: string
  repository?: string
  sha?: string
}

export type CodingAgentToolResult = GuardWorkflowResult & {
  tool: CodingAgentToolName
  action_type: "ci_privilege" | "deploy"
  executed: boolean
}

/**
 * OpenAI / GitHub Copilot function tools.
 * Copilot coding agent calls these instead of deploying or mutating secrets itself.
 */
export const CODING_AGENT_TOOLS: CodingAgentToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "run_ci_privilege",
      description:
        "Run tests and typecheck for this SHA. Evaluates Limetry ci_privilege before the job proceeds. Safe on pull_request.",
      parameters: {
        type: "object",
        properties: {
          repository: {
            type: "string",
            description: "owner/repo",
          },
          sha: {
            type: "string",
            description: "Git SHA being tested",
          },
          eventName: {
            type: "string",
            description: "GitHub event name, e.g. pull_request or push",
          },
          ref: {
            type: "string",
            description: "Git ref, e.g. refs/pull/42/merge",
          },
        },
        required: ["repository", "sha"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "request_production_deploy",
      description:
        "Request a production deploy. Fork and pull_request events are denied. Trusted main deploys return approval_required until an operator signs off.",
      parameters: {
        type: "object",
        properties: {
          repository: {
            type: "string",
            description: "owner/repo",
          },
          sha: {
            type: "string",
            description: "Git SHA to deploy",
          },
          eventName: {
            type: "string",
            description: "GitHub event name, e.g. push or pull_request",
          },
          ref: {
            type: "string",
            description: "Git ref, e.g. refs/heads/main",
          },
        },
        required: ["repository", "sha"],
      },
    },
  },
]

/**
 * Dispatch a Copilot coding-agent tool through Limetry before any deploy secrets are used.
 */
export async function dispatchCodingAgentTool(
  context: CodingAgentContext,
  tool: CodingAgentToolName,
  args: CodingAgentToolArgs = {},
): Promise<CodingAgentToolResult> {
  const actionType = tool === "run_ci_privilege" ? "ci_privilege" : "deploy"
  const eventName = args.eventName ?? context.eventName
  const ref = args.ref ?? context.ref
  const guarded = await guardDeploymentWorkflow({
    eventName,
    ref,
    repository: args.repository ?? context.repository,
    sha: args.sha ?? context.sha,
    apiKey: context.apiKey,
    baseUrl: context.baseUrl,
    fetch: context.fetch,
    actionType,
  })

  return {
    ...guarded,
    tool,
    action_type: actionType,
    executed: guarded.decision === "allow",
    trust: guarded.trust || classifyEventTrust({ eventName, ref }),
  }
}
