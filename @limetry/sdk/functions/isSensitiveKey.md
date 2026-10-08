[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / isSensitiveKey

# Function: isSensitiveKey()

> **isSensitiveKey**(`key`): `boolean`

Defined in: [privacy/redact.ts:39](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/privacy/redact.ts#L39)

Returns whether a metadata/details key name looks like a secret or credential.

## Parameters

### key

`string`

Object key to test.

## Returns

`boolean`

`true` when the key name matches known secret/credential patterns.
