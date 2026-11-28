[**Limetry v1.2.106**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sql](../README.md) / classifySql

# Function: classifySql()

> **classifySql**(`sql`): [`SqlClass`](../type-aliases/SqlClass.md)

Defined in: [classify-sql.ts:52](https://github.com/limetry/limetry/blob/177ce0a005d959d4fe84246d6472f9dda4bb7e04/packages/sql/src/classify-sql.ts#L52)

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
