[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../README.md)

***

[Limetry](../../README.md) / @limetry/sdk

# `@limetry/sdk`

TypeScript SDK for Limetry agent action governance. Evaluate an action before it runs, then record a privacy-safe audit of what happened.

## Install

```bash
npm install @limetry/sdk
```

This installs the published package, so `npm install`, `yarn add`, and
`pnpm add` are equivalent. For a cloned Limetry repository, use the root Yarn
Berry workspace instructions.

Requires Node.js 20 or newer.

## Evaluate an action

`LIMETRY_API_KEY` is a bearer token from `limetry setup` or your organization. `LIMETRY_BASE_URL` overrides the default API origin (`https://api.limetry.com`).

The v1 API hosts `api.limetry.org` and `api.app.limetry.com` are retired. Use
`api.limetry.com` (or `api.dev.limetry.com` for the hosted development stack).

```ts
import { createRemoteEngine } from "@limetry/sdk"

const engine = createRemoteEngine()

const result = await engine.evaluateAction({
  intent_id: "11111111-1111-4111-8111-111111111111",
  policy_id: "22222222-2222-4222-8222-222222222222",
  agent_id: "checkout-agent",
  action_type: "http.request",
  resource: "https://example.com/orders",
})

console.log(result.decision)
```

`decision` is `allow`, `deny`, or `approval_required`. Adapters such as `@limetry/cli`, `@limetry/sql`, and `@limetry/shopify` call this same engine.

## Privacy

Do not put API keys, passwords, or chat transcripts in action metadata. Use `redactDetails` and `projectIntentForAudit` before you store an audit record. The default audit mode keeps a minimized projection.

## License

MIT

Public entry for `\@limetry/sdk`.

Re-exports policy engine clients, typed policy/intent contracts, privacy
helpers for audit projections, and Limetry error classes used by adapters
(`\@limetry/ci`, `\@limetry/sql`, `\@limetry/shopify`) and CLI/MCP tooling.

## Classes

- [EngineLoadError](classes/EngineLoadError.md)
- [LimetryError](classes/LimetryError.md)
- [PaymentInterceptionError](classes/PaymentInterceptionError.md)
- [PolicyViolationError](classes/PolicyViolationError.md)
- [RateLimitExceededError](classes/RateLimitExceededError.md)
- [RemotePolicyEngine](classes/RemotePolicyEngine.md)

## Type Aliases

- [ActionDecision](type-aliases/ActionDecision.md)
- [ActionEvaluationOutcome](type-aliases/ActionEvaluationOutcome.md)
- [ActionEvaluationResponse](type-aliases/ActionEvaluationResponse.md)
- [ActionIntent](type-aliases/ActionIntent.md)
- [ActionPolicy](type-aliases/ActionPolicy.md)
- [AuditIntentProjection](type-aliases/AuditIntentProjection.md)
- [AuditMode](type-aliases/AuditMode.md)
- [ChatCompletionClient](type-aliases/ChatCompletionClient.md)
- [ChatCompletionRequest](type-aliases/ChatCompletionRequest.md)
- [ChatCompletionResponse](type-aliases/ChatCompletionResponse.md)
- [ChatToolCall](type-aliases/ChatToolCall.md)
- [DestinationRules](type-aliases/DestinationRules.md)
- [EffectiveWindow](type-aliases/EffectiveWindow.md)
- [EvaluationOutcome](type-aliases/EvaluationOutcome.md)
- [EvaluationState](type-aliases/EvaluationState.md)
- [IntentStatus](type-aliases/IntentStatus.md)
- [IsolationBounds](type-aliases/IsolationBounds.md)
- [MoneyAmount](type-aliases/MoneyAmount.md)
- [PayeeDescriptor](type-aliases/PayeeDescriptor.md)
- [PaymentExecutionToolArgs](type-aliases/PaymentExecutionToolArgs.md)
- [PolicyEngine](type-aliases/PolicyEngine.md)
- [PolicyEvaluationResponse](type-aliases/PolicyEvaluationResponse.md)
- [PolicyStatus](type-aliases/PolicyStatus.md)
- [RemotePolicyEngineOptions](type-aliases/RemotePolicyEngineOptions.md)
- [ReplayProtectionConfig](type-aliases/ReplayProtectionConfig.md)
- [SlimActionPolicyInput](type-aliases/SlimActionPolicyInput.md)
- [SlimPolicyInput](type-aliases/SlimPolicyInput.md)
- [SpendingLimits](type-aliases/SpendingLimits.md)
- [SpendingPolicy](type-aliases/SpendingPolicy.md)
- [TransactionCategory](type-aliases/TransactionCategory.md)
- [TransactionIntent](type-aliases/TransactionIntent.md)
- [VelocityLimits](type-aliases/VelocityLimits.md)

## Variables

- [APP\_VERSION](variables/APP_VERSION.md)
- [COMPATIBILITY](variables/COMPATIBILITY.md)
- [DEFAULT\_AUDIT\_MODE](variables/DEFAULT_AUDIT_MODE.md)
- [DEFAULT\_LIMETRY\_BASE\_URL](variables/DEFAULT_LIMETRY_BASE_URL.md)
- [DEFAULT\_LIMETRY\_CLOUD\_BASE\_URL](variables/DEFAULT_LIMETRY_CLOUD_BASE_URL.md)
- [LIMETRY\_CLOUD\_APP\_ORIGIN](variables/LIMETRY_CLOUD_APP_ORIGIN.md)
- [LIMETRY\_CLOUD\_ORIGINS](variables/LIMETRY_CLOUD_ORIGINS.md)
- [LIMETRY\_OSS\_ORIGINS](variables/LIMETRY_OSS_ORIGINS.md)

## Functions

- [buildEvaluatedAuditDetails](functions/buildEvaluatedAuditDetails.md)
- [buildMinimizedAuthorizationRequest](functions/buildMinimizedAuthorizationRequest.md)
- [buildMinimizedAuthorizationResponse](functions/buildMinimizedAuthorizationResponse.md)
- [buildRecordedAuditDetails](functions/buildRecordedAuditDetails.md)
- [createRemoteEngine](functions/createRemoteEngine.md)
- [createSlimActionPolicy](functions/createSlimActionPolicy.md)
- [createSlimPolicy](functions/createSlimPolicy.md)
- [isSensitiveKey](functions/isSensitiveKey.md)
- [projectIntentForAudit](functions/projectIntentForAudit.md)
- [redactActionIntent](functions/redactActionIntent.md)
- [redactDetails](functions/redactDetails.md)
- [redactMetadata](functions/redactMetadata.md)
- [resolveAuditMode](functions/resolveAuditMode.md)
- [resolveLimetryBaseUrl](functions/resolveLimetryBaseUrl.md)
- [resolveLimetryCloudBaseUrl](functions/resolveLimetryCloudBaseUrl.md)
- [scrubEmbeddedSecrets](functions/scrubEmbeddedSecrets.md)
- [scrubResource](functions/scrubResource.md)
