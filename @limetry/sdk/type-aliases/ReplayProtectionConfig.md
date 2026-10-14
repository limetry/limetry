[**Limetry v1.2.80**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / ReplayProtectionConfig

# Type Alias: ReplayProtectionConfig

> **ReplayProtectionConfig** = `object`

Defined in: [types.ts:84](https://github.com/limetry/limetry/blob/a4abe7149ae07b5757f2fdd4b9ab51e2090b8264/packages/sdk/src/types.ts#L84)

Nonce and clock rules that defend against replayed intents.

## Properties

### max\_clock\_skew\_seconds

> **max\_clock\_skew\_seconds**: `number`

Defined in: [types.ts:92](https://github.com/limetry/limetry/blob/a4abe7149ae07b5757f2fdd4b9ab51e2090b8264/packages/sdk/src/types.ts#L92)

Maximum allowed clock skew (seconds) when validating timestamps.

***

### nonce\_window\_seconds

> **nonce\_window\_seconds**: `number`

Defined in: [types.ts:88](https://github.com/limetry/limetry/blob/a4abe7149ae07b5757f2fdd4b9ab51e2090b8264/packages/sdk/src/types.ts#L88)

How long (seconds) a nonce remains valid after issue.

***

### require\_monotonic\_nonce

> **require\_monotonic\_nonce**: `boolean`

Defined in: [types.ts:96](https://github.com/limetry/limetry/blob/a4abe7149ae07b5757f2fdd4b9ab51e2090b8264/packages/sdk/src/types.ts#L96)

When true, nonces must increase monotonically per agent.
