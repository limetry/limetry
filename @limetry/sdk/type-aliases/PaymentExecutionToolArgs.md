[**Limetry v1.2.55**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / PaymentExecutionToolArgs

# Type Alias: PaymentExecutionToolArgs

> **PaymentExecutionToolArgs** = `object`

Defined in: [types.ts:614](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/types.ts#L614)

Arguments for a payment-execution tool call intercepted by Limetry adapters.

## Properties

### amount\_minor

> **amount\_minor**: `number`

Defined in: [types.ts:626](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/types.ts#L626)

Transfer amount in minor units.

***

### category

> **category**: [`TransactionCategory`](TransactionCategory.md)

Defined in: [types.ts:638](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/types.ts#L638)

Spend category for the transfer.

***

### currency

> **currency**: `string`

Defined in: [types.ts:630](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/types.ts#L630)

ISO 4217 currency code.

***

### idempotency\_key

> **idempotency\_key**: `string`

Defined in: [types.ts:642](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/types.ts#L642)

Idempotency key for the tool invocation.

***

### memo

> **memo**: `string`

Defined in: [types.ts:634](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/types.ts#L634)

Short payment memo.

***

### merchant\_id

> **merchant\_id**: `string`

Defined in: [types.ts:618](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/types.ts#L618)

Destination merchant identifier.

***

### merchant\_name

> **merchant\_name**: `string`

Defined in: [types.ts:622](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/types.ts#L622)

Destination merchant display name.
