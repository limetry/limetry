[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / TransactionIntent

# Type Alias: TransactionIntent

> **TransactionIntent** = `object`

Defined in: [types.ts:376](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/types.ts#L376)

Payment intent subject to spending-policy evaluation.

## Properties

### agent\_id

> **agent\_id**: `string`

Defined in: [types.ts:388](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/types.ts#L388)

Agent that issued the intent.

***

### amount

> **amount**: [`MoneyAmount`](MoneyAmount.md)

Defined in: [types.ts:392](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/types.ts#L392)

Amount to transfer.

***

### category

> **category**: [`TransactionCategory`](TransactionCategory.md)

Defined in: [types.ts:400](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/types.ts#L400)

Spend category for reporting and policy rules.

***

### expires\_at

> **expires\_at**: `string`

Defined in: [types.ts:412](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/types.ts#L412)

Expiry timestamp (ISO-8601).

***

### idempotency\_key

> **idempotency\_key**: `string`

Defined in: [types.ts:420](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/types.ts#L420)

Caller idempotency key for safe retries.

***

### intent\_id

> **intent\_id**: `string`

Defined in: [types.ts:380](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/types.ts#L380)

Unique intent identifier.

***

### issued\_at

> **issued\_at**: `string`

Defined in: [types.ts:408](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/types.ts#L408)

Issue timestamp (ISO-8601).

***

### memo

> **memo**: `string`

Defined in: [types.ts:404](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/types.ts#L404)

Short human-readable memo.

***

### metadata

> **metadata**: `Record`\<`string`, `string`\>

Defined in: [types.ts:424](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/types.ts#L424)

Opaque string metadata bag.

***

### nonce

> **nonce**: `number`

Defined in: [types.ts:416](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/types.ts#L416)

Monotonic replay nonce.

***

### payee

> **payee**: [`PayeeDescriptor`](PayeeDescriptor.md)

Defined in: [types.ts:396](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/types.ts#L396)

Destination merchant descriptor.

***

### policy\_id

> **policy\_id**: `string`

Defined in: [types.ts:384](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/types.ts#L384)

Policy document governing this intent.

***

### status

> **status**: [`IntentStatus`](IntentStatus.md)

Defined in: [types.ts:428](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/types.ts#L428)

Current intent lifecycle status.
