[**Limetry v1.2.85**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/ci](../README.md) / buildCiIntent

# Function: buildCiIntent()

> **buildCiIntent**(`input`): [`ActionIntent`](../../sdk/type-aliases/ActionIntent.md)

Defined in: [intent.ts:45](https://github.com/limetry/limetry/blob/a92c96e29b937113a9a42b230a461a37c4719e91/packages/ci/src/intent.ts#L45)

Build an ActionIntent for CI privilege or release/deploy gating.

## Parameters

### input

[`BuildCiIntentInput`](../type-aliases/BuildCiIntentInput.md)

Policy, agent, action type, resource, and optional metadata.

## Returns

[`ActionIntent`](../../sdk/type-aliases/ActionIntent.md)

A new ActionIntent with a generated `intent_id`.
