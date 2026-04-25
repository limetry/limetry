import { describe, expect, it } from "vitest"

import type { ActionIntent } from "../types.js"
import {
  buildEvaluatedAuditDetails,
  buildMinimizedAuthorizationRequest,
  buildRecordedAuditDetails,
  isSensitiveKey,
  projectIntentForAudit,
  redactActionIntent,
  redactDetails,
  redactMetadata,
  resolveAuditMode,
  scrubEmbeddedSecrets,
  scrubResource,
} from "./redact.js"

const baseIntent = (): ActionIntent => ({
  intent_id: "11111111-1111-4111-8111-111111111111",
  policy_id: "22222222-2222-4222-8222-222222222222",
  agent_id: "ci-bot",
  action_type: "http_post",
  resource: "https://user:pass@api.example.com/deploy?token=super-secret&x=1",
  metadata: {
    note: "ok",
    api_key: "sk-live-abc",
    Authorization: "Bearer abc.def",
  },
  issued_at: "2026-07-27T12:00:00.000Z",
})

describe("scrubResource", () => {
  it("removes userinfo, query, and hash from URLs", () => {
    expect(scrubResource("https://user:pass@api.example.com/path?token=1#frag")).toBe(
      "https://api.example.com/path",
    )
  })

  it("strips query from non-URL resources", () => {
    expect(scrubResource("arn:aws:s3:::bucket?version=1")).toBe("arn:aws:s3:::bucket")
  })
})

describe("redactMetadata", () => {
  it("redacts sensitive keys and scrubbing values", () => {
    expect(redactMetadata({
      api_key: "secret",
      note: "Bearer abc123",
    })).toEqual({
      api_key: "[REDACTED]",
      note: "Bearer [REDACTED]",
    })
  })
})

describe("redactDetails", () => {
  it("recursively redacts nested sensitive keys", () => {
    expect(redactDetails({
      headers: { Authorization: "Bearer x", accept: "json" },
      body: { password: "p", ok: true },
    })).toEqual({
      headers: { Authorization: "[REDACTED]", accept: "json" },
      body: { password: "[REDACTED]", ok: true },
    })
  })
})

describe("redactActionIntent", () => {
  it("scrubs resource and metadata", () => {
    const redacted = redactActionIntent(baseIntent())
    expect(redacted.resource).toBe("https://api.example.com/deploy")
    expect(redacted.metadata?.api_key).toBe("[REDACTED]")
    expect(redacted.metadata?.note).toBe("ok")
  })
})

describe("projectIntentForAudit", () => {
  it("drops metadata in minimal mode", () => {
    const projected = projectIntentForAudit(baseIntent(), "minimal")
    expect(projected.metadata).toBeUndefined()
    expect(projected.resource).toBe("https://api.example.com/deploy")
  })

  it("keeps redacted metadata in forensics mode", () => {
    const projected = projectIntentForAudit(baseIntent(), "forensics")
    expect(projected.metadata?.api_key).toBe("[REDACTED]")
  })
})

describe("buildEvaluatedAuditDetails", () => {
  it("tags audit_mode and projects intent", () => {
    const details = buildEvaluatedAuditDetails({
      approved: false,
      reasons: ["denied"],
      policy_id: baseIntent().policy_id,
      intent: baseIntent(),
      mode: "minimal",
    })
    expect(details.audit_mode).toBe("minimal")
    expect((details.intent as { resource: string }).resource).toBe(
      "https://api.example.com/deploy",
    )
    expect(details.resource).toBe("https://api.example.com/deploy")
  })
})

describe("buildRecordedAuditDetails", () => {
  it("omits details bag in minimal mode", () => {
    const details = buildRecordedAuditDetails({
      outcome: "executed",
      intent: baseIntent(),
      details: { Authorization: "Bearer x", path: "/ok" },
      mode: "minimal",
    })
    expect(details.details).toBeUndefined()
  })

  it("keeps redacted details in forensics mode", () => {
    const details = buildRecordedAuditDetails({
      outcome: "blocked",
      intent: baseIntent(),
      details: { api_token: "x", path: "/ok" },
      mode: "forensics",
    })
    expect(details.details).toEqual({ api_token: "[REDACTED]", path: "/ok" })
  })
})

describe("resolveAuditMode", () => {
  it("prefers policy over env over default", () => {
    expect(resolveAuditMode({ audit_mode: "forensics" }, "minimal")).toBe("forensics")
    expect(resolveAuditMode({}, "forensics")).toBe("forensics")
    expect(resolveAuditMode({}, null)).toBe("minimal")
  })
})

describe("buildMinimizedAuthorizationRequest", () => {
  it("stores digest and projected intent only", () => {
    const request = buildMinimizedAuthorizationRequest({
      tenantId: "t1",
      policyId: baseIntent().policy_id,
      intent: baseIntent(),
      intentDigestHex: "abc",
      mode: "minimal",
    })
    expect(request.intent_digest_hex).toBe("abc")
    expect(JSON.stringify(request)).not.toContain("super-secret")
    expect(JSON.stringify(request)).not.toContain("sk-live-abc")
  })
})

describe("helpers", () => {
  it("detects sensitive keys", () => {
    expect(isSensitiveKey("api_key")).toBe(true)
    expect(isSensitiveKey("resource_path")).toBe(false)
  })

  it("scrubs embedded bearer tokens", () => {
    expect(scrubEmbeddedSecrets("Authorization: Bearer abc.def.ghi")).toContain("[REDACTED]")
  })
})
