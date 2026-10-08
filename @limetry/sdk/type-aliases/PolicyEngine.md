[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / PolicyEngine

# Type Alias: PolicyEngine

> **PolicyEngine** = `object`

Defined in: [engine/policy-engine.ts:13](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/engine/policy-engine.ts#L13)

Shared interface implemented by [RemotePolicyEngine](../classes/RemotePolicyEngine.md) (HTTP).

Adapters call `evaluateAction` and must not reimplement policy logic.

## Properties

### evaluateAction

> **evaluateAction**: (`intent`) => `Promise`\<[`ActionEvaluationResponse`](ActionEvaluationResponse.md)\>

Defined in: [engine/policy-engine.ts:20](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/engine/policy-engine.ts#L20)

Evaluates an [ActionIntent](ActionIntent.md) against the configured policy engine.

#### Parameters

##### intent

[`ActionIntent`](ActionIntent.md)

Action intent to evaluate.

#### Returns

`Promise`\<[`ActionEvaluationResponse`](ActionEvaluationResponse.md)\>

Promise resolving to an [ActionEvaluationResponse](ActionEvaluationResponse.md).
