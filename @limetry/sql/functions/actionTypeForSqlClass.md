[**Limetry v1.2.55**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sql](../README.md) / actionTypeForSqlClass

# Function: actionTypeForSqlClass()

> **actionTypeForSqlClass**(`sqlClass`): `string`

Defined in: [classify-sql.ts:84](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sql/src/classify-sql.ts#L84)

Map a SQL class onto Limetry action_type values.

Unknown classes map to `sql.write` so they remain gated.

## Parameters

### sqlClass

[`SqlClass`](../type-aliases/SqlClass.md)

Classification from [classifySql](classifySql.md).

## Returns

`string`

`sql.read`, `sql.ddl`, or `sql.write`.
