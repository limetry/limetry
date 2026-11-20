[**Limetry v1.2.95**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/ci](../README.md) / buildCiIntent

# Function: buildCiIntent()

> **buildCiIntent**(`input`): [`ActionIntent`](../../sdk/type-aliases/ActionIntent.md)

Defined in: [intent.ts:45](https://github.com/limetry/limetry/blob/a7611e6e95f8c7e1ea98c503d1daeb65dbc76a3c/packages/ci/src/intent.ts#L45)

Build an ActionIntent for CI privilege or release/deploy gating.

## Parameters

### input

[`BuildCiIntentInput`](../type-aliases/BuildCiIntentInput.md)

Policy, agent, action type, resource, and optional metadata.

## Returns

[`ActionIntent`](../../sdk/type-aliases/ActionIntent.md)

A new ActionIntent with a generated `intent_id`.
