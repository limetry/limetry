[**Limetry v1.2.95**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sql](../README.md) / actionTypeForSqlClass

# Function: actionTypeForSqlClass()

> **actionTypeForSqlClass**(`sqlClass`): `string`

Defined in: [classify-sql.ts:84](https://github.com/limetry/limetry/blob/a7611e6e95f8c7e1ea98c503d1daeb65dbc76a3c/packages/sql/src/classify-sql.ts#L84)

Map a SQL class onto Limetry action_type values.

Unknown classes map to `sql.write` so they remain gated.

## Parameters

### sqlClass

[`SqlClass`](../type-aliases/SqlClass.md)

Classification from [classifySql](classifySql.md).

## Returns

`string`

`sql.read`, `sql.ddl`, or `sql.write`.
