[**Limetry v1.2.85**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / isSensitiveKey

# Function: isSensitiveKey()

> **isSensitiveKey**(`key`): `boolean`

Defined in: [privacy/redact.ts:39](https://github.com/limetry/limetry/blob/a92c96e29b937113a9a42b230a461a37c4719e91/packages/sdk/src/privacy/redact.ts#L39)

Returns whether a metadata/details key name looks like a secret or credential.

## Parameters

### key

`string`

Object key to test.

## Returns

`boolean`

`true` when the key name matches known secret/credential patterns.
