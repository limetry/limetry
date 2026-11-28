[**Limetry v1.2.106**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sql](../README.md) / actionTypeForSqlClass

# Function: actionTypeForSqlClass()

> **actionTypeForSqlClass**(`sqlClass`): `string`

Defined in: [classify-sql.ts:84](https://github.com/limetry/limetry/blob/177ce0a005d959d4fe84246d6472f9dda4bb7e04/packages/sql/src/classify-sql.ts#L84)

Map a SQL class onto Limetry action_type values.

Unknown classes map to `sql.write` so they remain gated.

## Parameters

### sqlClass

[`SqlClass`](../type-aliases/SqlClass.md)

Classification from [classifySql](classifySql.md).

## Returns

`string`

`sql.read`, `sql.ddl`, or `sql.write`.
