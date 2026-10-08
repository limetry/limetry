[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / IsolationBounds

# Type Alias: IsolationBounds

> **IsolationBounds** = `object`

Defined in: [types.ts:102](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/types.ts#L102)

Concurrency and TTL bounds for in-flight payment intents.

## Properties

### enforce\_unique\_payee\_per\_intent\_batch

> **enforce\_unique\_payee\_per\_intent\_batch**: `boolean`

Defined in: [types.ts:118](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/types.ts#L118)

When true, a batch may not target the same payee more than once.

***

### intent\_ttl\_seconds

> **intent\_ttl\_seconds**: `number`

Defined in: [types.ts:114](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/types.ts#L114)

Time-to-live (seconds) for a pending intent before expiry.

***

### max\_concurrent\_pending\_intents

> **max\_concurrent\_pending\_intents**: `number`

Defined in: [types.ts:106](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/types.ts#L106)

Maximum number of pending intents allowed at once.

***

### max\_pending\_aggregate\_minor

> **max\_pending\_aggregate\_minor**: `number`

Defined in: [types.ts:110](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/types.ts#L110)

Maximum aggregate pending amount (minor units).
