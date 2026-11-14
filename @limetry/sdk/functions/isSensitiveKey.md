[**Limetry v1.2.87**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / isSensitiveKey

# Function: isSensitiveKey()

> **isSensitiveKey**(`key`): `boolean`

Defined in: [privacy/redact.ts:39](https://github.com/limetry/limetry/blob/f14000dfffe19a47b41e78212d02a5eb934e0d18/packages/sdk/src/privacy/redact.ts#L39)

Returns whether a metadata/details key name looks like a secret or credential.

## Parameters

### key

`string`

Object key to test.

## Returns

`boolean`

`true` when the key name matches known secret/credential patterns.
