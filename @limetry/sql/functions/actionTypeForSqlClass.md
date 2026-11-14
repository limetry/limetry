[**Limetry v1.2.87**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sql](../README.md) / actionTypeForSqlClass

# Function: actionTypeForSqlClass()

> **actionTypeForSqlClass**(`sqlClass`): `string`

Defined in: [classify-sql.ts:84](https://github.com/limetry/limetry/blob/f14000dfffe19a47b41e78212d02a5eb934e0d18/packages/sql/src/classify-sql.ts#L84)

Map a SQL class onto Limetry action_type values.

Unknown classes map to `sql.write` so they remain gated.

## Parameters

### sqlClass

[`SqlClass`](../type-aliases/SqlClass.md)

Classification from [classifySql](classifySql.md).

## Returns

`string`

`sql.read`, `sql.ddl`, or `sql.write`.
