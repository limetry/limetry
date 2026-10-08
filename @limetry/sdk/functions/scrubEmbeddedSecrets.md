[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / scrubEmbeddedSecrets

# Function: scrubEmbeddedSecrets()

> **scrubEmbeddedSecrets**(`value`): `string`

Defined in: [privacy/redact.ts:163](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/privacy/redact.ts#L163)

Redacts common secret patterns embedded in free-text / URL query values.

Replaces query param values for token-like keys, Bearer tokens, and
`sk_live` / `sk_test` style secret key literals.

## Parameters

### value

`string`

Free-text string that may embed secrets.

## Returns

`string`

String with matched secret substrings replaced by `"[REDACTED]"`.
