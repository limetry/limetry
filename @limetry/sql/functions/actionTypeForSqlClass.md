[**Limetry v1.2.80**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sql](../README.md) / actionTypeForSqlClass

# Function: actionTypeForSqlClass()

> **actionTypeForSqlClass**(`sqlClass`): `string`

Defined in: [classify-sql.ts:84](https://github.com/limetry/limetry/blob/a4abe7149ae07b5757f2fdd4b9ab51e2090b8264/packages/sql/src/classify-sql.ts#L84)

Map a SQL class onto Limetry action_type values.

Unknown classes map to `sql.write` so they remain gated.

## Parameters

### sqlClass

[`SqlClass`](../type-aliases/SqlClass.md)

Classification from [classifySql](classifySql.md).

## Returns

`string`

`sql.read`, `sql.ddl`, or `sql.write`.
