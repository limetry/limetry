[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sql](../README.md) / classifySql

# Function: classifySql()

> **classifySql**(`sql`): [`SqlClass`](../type-aliases/SqlClass.md)

Defined in: [classify-sql.ts:52](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sql/src/classify-sql.ts#L52)

Classify a SQL statement with a conservative keyword heuristic.
Not a full parser — treat unknown as write-gated.

Strips block and line comments, then inspects the first token.

## Parameters

### sql

`string`

Raw SQL text to classify.

## Returns

[`SqlClass`](../type-aliases/SqlClass.md)

`"read"`, `"write"`, `"ddl"`, or `"unknown"` (empty / unrecognized).
