[**Limetry v1.2.87**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / PolicyEngine

# Type Alias: PolicyEngine

> **PolicyEngine** = `object`

Defined in: [engine/policy-engine.ts:13](https://github.com/limetry/limetry/blob/f14000dfffe19a47b41e78212d02a5eb934e0d18/packages/sdk/src/engine/policy-engine.ts#L13)

Shared interface implemented by [RemotePolicyEngine](../classes/RemotePolicyEngine.md) (HTTP).

Adapters call `evaluateAction` and must not reimplement policy logic.

## Properties

### evaluateAction

> **evaluateAction**: (`intent`) => `Promise`\<[`ActionEvaluationResponse`](ActionEvaluationResponse.md)\>

Defined in: [engine/policy-engine.ts:20](https://github.com/limetry/limetry/blob/f14000dfffe19a47b41e78212d02a5eb934e0d18/packages/sdk/src/engine/policy-engine.ts#L20)

Evaluates an [ActionIntent](ActionIntent.md) against the configured policy engine.

#### Parameters

##### intent

[`ActionIntent`](ActionIntent.md)

Action intent to evaluate.

#### Returns

`Promise`\<[`ActionEvaluationResponse`](ActionEvaluationResponse.md)\>

Promise resolving to an [ActionEvaluationResponse](ActionEvaluationResponse.md).
