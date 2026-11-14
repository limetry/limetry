[**Limetry v1.2.87**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/ci](../README.md) / buildCiIntent

# Function: buildCiIntent()

> **buildCiIntent**(`input`): [`ActionIntent`](../../sdk/type-aliases/ActionIntent.md)

Defined in: [intent.ts:45](https://github.com/limetry/limetry/blob/f14000dfffe19a47b41e78212d02a5eb934e0d18/packages/ci/src/intent.ts#L45)

Build an ActionIntent for CI privilege or release/deploy gating.

## Parameters

### input

[`BuildCiIntentInput`](../type-aliases/BuildCiIntentInput.md)

Policy, agent, action type, resource, and optional metadata.

## Returns

[`ActionIntent`](../../sdk/type-aliases/ActionIntent.md)

A new ActionIntent with a generated `intent_id`.
