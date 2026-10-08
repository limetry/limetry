[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / redactMetadata

# Function: redactMetadata()

> **redactMetadata**(`metadata`): `Record`\<`string`, `string`\> \| `undefined`

Defined in: [privacy/redact.ts:84](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/privacy/redact.ts#L84)

Drops or redacts sensitive keys from a string metadata map.

Sensitive keys keep their key but get value `"[REDACTED]"`; other values
pass through [scrubEmbeddedSecrets](scrubEmbeddedSecrets.md). Returns `undefined` for empty
or missing input.

## Parameters

### metadata

`Record`\<`string`, `string`\> \| `undefined`

Optional string key/value metadata bag.

## Returns

`Record`\<`string`, `string`\> \| `undefined`

Redacted metadata, or `undefined` when empty/absent.
