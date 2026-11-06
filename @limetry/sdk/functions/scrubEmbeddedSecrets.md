[**Limetry v1.2.85**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / scrubEmbeddedSecrets

# Function: scrubEmbeddedSecrets()

> **scrubEmbeddedSecrets**(`value`): `string`

Defined in: [privacy/redact.ts:163](https://github.com/limetry/limetry/blob/a92c96e29b937113a9a42b230a461a37c4719e91/packages/sdk/src/privacy/redact.ts#L163)

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
