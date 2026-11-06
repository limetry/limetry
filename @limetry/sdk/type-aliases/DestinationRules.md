[**Limetry v1.2.85**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / DestinationRules

# Type Alias: DestinationRules

> **DestinationRules** = `object`

Defined in: [types.ts:124](https://github.com/limetry/limetry/blob/a92c96e29b937113a9a42b230a461a37c4719e91/packages/sdk/src/types.ts#L124)

Merchant and MCC allow/block rules for payment destinations.

## Properties

### allowed\_mcc\_codes

> **allowed\_mcc\_codes**: `string`[]

Defined in: [types.ts:132](https://github.com/limetry/limetry/blob/a92c96e29b937113a9a42b230a461a37c4719e91/packages/sdk/src/types.ts#L132)

Merchant Category Codes that are explicitly allowed.

***

### allowed\_merchant\_ids

> **allowed\_merchant\_ids**: `string`[]

Defined in: [types.ts:128](https://github.com/limetry/limetry/blob/a92c96e29b937113a9a42b230a461a37c4719e91/packages/sdk/src/types.ts#L128)

Merchant IDs that are explicitly allowed.

***

### blocked\_merchant\_ids

> **blocked\_merchant\_ids**: `string`[]

Defined in: [types.ts:136](https://github.com/limetry/limetry/blob/a92c96e29b937113a9a42b230a461a37c4719e91/packages/sdk/src/types.ts#L136)

Merchant IDs that are explicitly blocked.

***

### require\_merchant\_allowlist

> **require\_merchant\_allowlist**: `boolean`

Defined in: [types.ts:140](https://github.com/limetry/limetry/blob/a92c96e29b937113a9a42b230a461a37c4719e91/packages/sdk/src/types.ts#L140)

When true, payees must appear on `allowed_merchant_ids`.
