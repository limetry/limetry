[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / SpendingLimits

# Type Alias: SpendingLimits

> **SpendingLimits** = `object`

Defined in: [types.ts:40](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/types.ts#L40)

Currency-denominated spending caps in minor units (for example cents).

## Properties

### currency

> **currency**: `string`

Defined in: [types.ts:56](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/types.ts#L56)

ISO 4217 currency code applying to the minor-unit amounts.

***

### max\_daily\_spend\_minor

> **max\_daily\_spend\_minor**: `number`

Defined in: [types.ts:48](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/types.ts#L48)

Maximum aggregate spend allowed within a rolling day.

***

### max\_monthly\_spend\_minor

> **max\_monthly\_spend\_minor**: `number`

Defined in: [types.ts:52](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/types.ts#L52)

Maximum aggregate spend allowed within a rolling month.

***

### max\_single\_transaction\_minor

> **max\_single\_transaction\_minor**: `number`

Defined in: [types.ts:44](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/types.ts#L44)

Maximum amount allowed for a single transaction.
