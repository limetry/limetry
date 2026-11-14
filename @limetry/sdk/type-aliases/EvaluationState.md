[**Limetry v1.2.87**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / EvaluationState

# Type Alias: EvaluationState

> **EvaluationState** = `object`

Defined in: [types.ts:436](https://github.com/limetry/limetry/blob/f14000dfffe19a47b41e78212d02a5eb934e0d18/packages/sdk/src/types.ts#L436)

Opaque engine state returned alongside spending evaluations.

Shape is engine-defined; clients should treat fields as pass-through.

## Properties

### replay\_store

> **replay\_store**: `Record`\<`string`, `unknown`\>

Defined in: [types.ts:444](https://github.com/limetry/limetry/blob/f14000dfffe19a47b41e78212d02a5eb934e0d18/packages/sdk/src/types.ts#L444)

Replay-store snapshot from the evaluating engine.

***

### velocity\_ledger

> **velocity\_ledger**: `Record`\<`string`, `unknown`\>

Defined in: [types.ts:440](https://github.com/limetry/limetry/blob/f14000dfffe19a47b41e78212d02a5eb934e0d18/packages/sdk/src/types.ts#L440)

Velocity ledger snapshot from the evaluating engine.
