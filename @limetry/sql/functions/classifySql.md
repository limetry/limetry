[**Limetry v1.2.87**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sql](../README.md) / classifySql

# Function: classifySql()

> **classifySql**(`sql`): [`SqlClass`](../type-aliases/SqlClass.md)

Defined in: [classify-sql.ts:52](https://github.com/limetry/limetry/blob/f14000dfffe19a47b41e78212d02a5eb934e0d18/packages/sql/src/classify-sql.ts#L52)

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
