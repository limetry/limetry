[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/ci](../README.md) / buildCiIntent

# Function: buildCiIntent()

> **buildCiIntent**(`input`): [`ActionIntent`](../../sdk/type-aliases/ActionIntent.md)

Defined in: [intent.ts:45](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/ci/src/intent.ts#L45)

Build an ActionIntent for CI privilege or release/deploy gating.

## Parameters

### input

[`BuildCiIntentInput`](../type-aliases/BuildCiIntentInput.md)

Policy, agent, action type, resource, and optional metadata.

## Returns

[`ActionIntent`](../../sdk/type-aliases/ActionIntent.md)

A new ActionIntent with a generated `intent_id`.
