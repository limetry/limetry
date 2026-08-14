import { createHmac } from "node:crypto"

import { describe, expect, it, vi } from "vitest"

import { classifyEventTrust } from "./classify.js"
import { evaluateCiPrivilege } from "./evaluate.js"
import { buildCiIntent, buildRepoShaResource } from "./intent.js"
import { verifyReleaseReceipt } from "./receipt.js"
import { runAction } from "./run-action.js"

describe("classifyEventTrust", () => {
  it("marks pull_request events as untrusted", () => {
    expect(classifyEventTrust({ eventName: "pull_request" })).toBe("untrusted")
  })

  it("marks push and release events as trusted", () => {
    expect(classifyEventTrust({ eventName: "push" })).toBe("trusted")
    expect(classifyEventTrust({ eventName: "release" })).toBe("trusted")
  })
})

describe("buildCiIntent", () => {
  it("binds repository and sha into the resource", () => {
    const resource = buildRepoShaResource("acme/app", "abc123")
    const intent = buildCiIntent({
      policyId: "11111111-1111-4111-8111-111111111111",
      agentId: "github_actions",
      actionType: "deploy",
      resource,
    })
    expect(intent.resource).toBe("acme/app@abc123")
    expect(intent.action_type).toBe("deploy")
  })
})

describe("verifyReleaseReceipt", () => {
  it("accepts a matching HMAC receipt", () => {
    const secret = "test-decision-hmac-secret-at-least-32-chars"
    const digest = "repo@sha"
    const decision = "allow"
    const decisionId = "dec-1"
    const reasons = ["ok"]
    const exp = Math.floor(Date.now() / 1000) + 300
    const payload = [decisionId, decision, digest, String(exp), reasons.join("|")].join(".")
    const sig = createHmac("sha256", secret).update(payload).digest("hex")
    expect(verifyReleaseReceipt({
      receipt: {
        decision,
        decision_id: decisionId,
        digest,
        exp,
        reasons,
        sig,
      },
      expectedDigest: digest,
      secret,
    })).toBe(true)
  })

  it("rejects digest mismatches", () => {
    expect(verifyReleaseReceipt({
      receipt: {
        decision: "allow",
        decision_id: "dec-1",
        digest: "a",
        exp: 1,
        reasons: [],
        sig: "00",
      },
      expectedDigest: "b",
      secret: "secret",
    })).toBe(false)
  })
})

describe("evaluateCiPrivilege", () => {
  it("calls RemotePolicyEngine with a repo@sha intent", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        ok: true,
        approved: true,
        decision: "allow",
        reasons: [],
        decision_id: "dec-1",
        receipt: {
          decision: "allow",
          decision_id: "dec-1",
          digest: "x",
          reasons: [],
          sig: "y",
          alg: "HS256",
        },
      }),
    })) as unknown as typeof fetch

    const result = await evaluateCiPrivilege({
      apiKey: "token",
      baseUrl: "http://localhost:3810",
      policyId: "11111111-1111-4111-8111-111111111111",
      agentId: "github_actions",
      actionType: "ci_privilege",
      repository: "acme/app",
      sha: "deadbeef",
      eventName: "push",
      fetch: fetchMock,
    })

    expect(result.trust).toBe("trusted")
    expect(result.intent.resource).toBe("acme/app@deadbeef")
    expect(result.evaluation.decision).toBe("allow")
    expect(fetchMock).toHaveBeenCalledOnce()
  })
})

describe("runAction", () => {
  it("fails untrusted privileged runs when require_trusted is true", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        ok: true,
        approved: true,
        decision: "allow",
        reasons: [],
        decision_id: "dec-1",
      }),
    })) as unknown as typeof fetch
    const previousFetch = globalThis.fetch
    globalThis.fetch = fetchMock

    const code = await runAction({
      GITHUB_EVENT_NAME: "pull_request",
      GITHUB_SHA: "abc",
      GITHUB_REPOSITORY: "acme/app",
      INPUT_LIMETRY_API_KEY: "token",
      INPUT_POLICY_ID: "11111111-1111-4111-8111-111111111111",
      INPUT_REQUIRE_TRUSTED: "true",
      LIMETRY_BASE_URL: "http://localhost:3810",
    })

    globalThis.fetch = previousFetch
    expect(code).toBe(1)
  })

  it("fails when Limetry denies a trusted deploy", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        ok: true,
        approved: false,
        decision: "deny",
        reasons: ["action_type deploy is denied"],
        decision_id: "dec-deny",
      }),
    })) as unknown as typeof fetch
    const previousFetch = globalThis.fetch
    globalThis.fetch = fetchMock

    const code = await runAction({
      GITHUB_EVENT_NAME: "push",
      GITHUB_REF: "refs/heads/main",
      GITHUB_SHA: "abc",
      GITHUB_REPOSITORY: "limetry/limetry",
      INPUT_LIMETRY_API_KEY: "token",
      INPUT_POLICY_ID: "11111111-1111-4111-8111-111111111111",
      INPUT_ACTION_TYPE: "deploy",
      INPUT_REQUIRE_TRUSTED: "false",
      LIMETRY_BASE_URL: "http://localhost:3810",
    })

    globalThis.fetch = previousFetch
    expect(code).toBe(1)
  })
})
