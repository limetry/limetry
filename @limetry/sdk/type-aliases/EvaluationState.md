[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / EvaluationState

# Type Alias: EvaluationState

> **EvaluationState** = `object`

Defined in: [types.ts:436](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/types.ts#L436)

Opaque engine state returned alongside spending evaluations.

Shape is engine-defined; clients should treat fields as pass-through.

## Properties

### replay\_store

> **replay\_store**: `Record`\<`string`, `unknown`\>

Defined in: [types.ts:444](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/types.ts#L444)

Replay-store snapshot from the evaluating engine.

***

### velocity\_ledger

> **velocity\_ledger**: `Record`\<`string`, `unknown`\>

Defined in: [types.ts:440](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/types.ts#L440)

Velocity ledger snapshot from the evaluating engine.
