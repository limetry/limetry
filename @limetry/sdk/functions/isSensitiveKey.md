[**Limetry v1.2.106**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / isSensitiveKey

# Function: isSensitiveKey()

> **isSensitiveKey**(`key`): `boolean`

Defined in: [privacy/redact.ts:39](https://github.com/limetry/limetry/blob/177ce0a005d959d4fe84246d6472f9dda4bb7e04/packages/sdk/src/privacy/redact.ts#L39)

Returns whether a metadata/details key name looks like a secret or credential.

## Parameters

### key

`string`

Object key to test.

## Returns

`boolean`

`true` when the key name matches known secret/credential patterns.
