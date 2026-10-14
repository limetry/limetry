[**Limetry v1.2.80**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / PayeeDescriptor

# Type Alias: PayeeDescriptor

> **PayeeDescriptor** = `object`

Defined in: [types.ts:340](https://github.com/limetry/limetry/blob/a4abe7149ae07b5757f2fdd4b9ab51e2090b8264/packages/sdk/src/types.ts#L340)

Payee identity attached to a payment [TransactionIntent](TransactionIntent.md).

## Properties

### mcc\_code

> **mcc\_code**: `string` \| `null`

Defined in: [types.ts:352](https://github.com/limetry/limetry/blob/a4abe7149ae07b5757f2fdd4b9ab51e2090b8264/packages/sdk/src/types.ts#L352)

Merchant Category Code, or `null` when unknown.

***

### merchant\_id

> **merchant\_id**: `string`

Defined in: [types.ts:344](https://github.com/limetry/limetry/blob/a4abe7149ae07b5757f2fdd4b9ab51e2090b8264/packages/sdk/src/types.ts#L344)

Merchant identifier used for allow/block matching.

***

### merchant\_name

> **merchant\_name**: `string`

Defined in: [types.ts:348](https://github.com/limetry/limetry/blob/a4abe7149ae07b5757f2fdd4b9ab51e2090b8264/packages/sdk/src/types.ts#L348)

Human-readable merchant name.

***

### routing\_hint

> **routing\_hint**: `string` \| `null`

Defined in: [types.ts:356](https://github.com/limetry/limetry/blob/a4abe7149ae07b5757f2fdd4b9ab51e2090b8264/packages/sdk/src/types.ts#L356)

Optional rail / routing hint for the payment processor.
