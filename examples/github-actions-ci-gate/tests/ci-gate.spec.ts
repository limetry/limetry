import { describe, expect, it, vi } from "vitest"

import { CODING_AGENT_TOOLS, dispatchCodingAgentTool } from "../src/coding-agent.js"
import { guardDeploymentWorkflow } from "../src/workflow-guard.js"

function mockEvaluate(body: Record<string, unknown>): ReturnType<typeof vi.fn> {
  return vi.fn(async () =>
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  )
}

const context = {
  repository: "acme/web-app",
  sha: "a1b2c3d4e5f6",
  apiKey: "test-ci-key",
}

describe("GitHub Copilot coding agent CI gate", () => {
  it("exposes Copilot function tools for privilege and deploy", () => {
    expect(CODING_AGENT_TOOLS.map((tool) => tool.function.name)).toEqual([
      "run_ci_privilege",
      "request_production_deploy",
    ])
  })

  it("allows ci_privilege so a PR coding agent can run typecheck", async () => {
    const fetchImpl = mockEvaluate({
      ok: true,
      approved: true,
      decision: "allow",
      decision_id: "dec-ci-allow",
      reasons: [],
    })

    const result = await dispatchCodingAgentTool(
      {
        ...context,
        eventName: "pull_request",
        ref: "refs/pull/42/merge",
        fetch: fetchImpl as unknown as typeof fetch,
      },
      "run_ci_privilege",
    )

    expect(result.decision).toBe("allow")
    expect(result.executed).toBe(true)
    expect(result.action_type).toBe("ci_privilege")
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it("denies production deploy from an untrusted pull_request without calling evaluate", async () => {
    const fetchImpl = mockEvaluate({ ok: true, approved: true, decision: "allow" })

    const result = await dispatchCodingAgentTool(
      {
        ...context,
        eventName: "pull_request",
        ref: "refs/pull/42/merge",
        fetch: fetchImpl as unknown as typeof fetch,
      },
      "request_production_deploy",
    )

    expect(result.decision).toBe("deny")
    expect(result.executed).toBe(false)
    expect(result.trust).toBe("untrusted")
    expect(result.reasons[0]).toContain("untrusted event")
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it("returns approval_required for a trusted main deploy and does not execute", async () => {
    const fetchImpl = mockEvaluate({
      ok: true,
      approved: false,
      decision: "approval_required",
      decision_id: "dec-ci-approval",
      approval_id: "approval-deploy-1",
      reasons: ["action_type deploy requires human approval"],
    })

    const result = await dispatchCodingAgentTool(
      {
        ...context,
        eventName: "push",
        ref: "refs/heads/main",
        fetch: fetchImpl as unknown as typeof fetch,
      },
      "request_production_deploy",
    )

    expect(result.decision).toBe("approval_required")
    expect(result.executed).toBe(false)
    expect(result.approval_id).toBe("approval-deploy-1")
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })
})

describe("GitHub Actions CI Gate Example", () => {
  it("allows typecheck on pull_request when actionType is ci_privilege", async () => {
    const mockFetch = mockEvaluate({
      ok: true,
      approved: true,
      decision: "allow",
      decision_id: "dec-ci-1",
      reasons: [],
    })

    const result = await guardDeploymentWorkflow({
      eventName: "pull_request",
      ref: "refs/pull/42/merge",
      repository: "acme/web-app",
      sha: "a1b2c3d4e5f6",
      apiKey: "test-ci-key",
      fetch: mockFetch as unknown as typeof fetch,
      actionType: "ci_privilege",
    })

    expect(result.allowed).toBe(true)
    expect(result.decision).toBe("allow")
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it("fast-fails and blocks untrusted pull request events from forks", async () => {
    const mockFetch = mockEvaluate({ ok: true, approved: true, decision: "allow" })

    const result = await guardDeploymentWorkflow({
      eventName: "pull_request",
      ref: "refs/pull/42/merge",
      repository: "acme/web-app",
      sha: "f6e5d4c3b2a1",
      apiKey: "test-ci-key",
      fetch: mockFetch as unknown as typeof fetch,
    })

    expect(result.allowed).toBe(false)
    expect(result.trust).toBe("untrusted")
    expect(result.decision).toBe("deny")
    expect(result.reasons[0]).toContain("Refusing privileged deployment for untrusted event")
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("reports rejection when Limetry policy rejects the deployment action", async () => {
    const mockFetch = mockEvaluate({
      ok: true,
      approved: false,
      decision: "deny",
      reasons: ["Branch refs/heads/staging is not authorized for production deploy"],
    })

    const result = await guardDeploymentWorkflow({
      eventName: "push",
      ref: "refs/heads/staging",
      repository: "acme/web-app",
      sha: "c3d4e5f6a1b2",
      apiKey: "test-ci-key",
      fetch: mockFetch as unknown as typeof fetch,
    })

    expect(result.allowed).toBe(false)
    expect(result.decision).toBe("deny")
    expect(result.reasons[0]).toContain("not authorized for production deploy")
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })
})
