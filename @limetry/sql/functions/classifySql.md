[**Limetry v1.2.85**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sql](../README.md) / classifySql

# Function: classifySql()

> **classifySql**(`sql`): [`SqlClass`](../type-aliases/SqlClass.md)

Defined in: [classify-sql.ts:52](https://github.com/limetry/limetry/blob/a92c96e29b937113a9a42b230a461a37c4719e91/packages/sql/src/classify-sql.ts#L52)

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
