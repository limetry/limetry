[**Limetry v1.2.87**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / scrubEmbeddedSecrets

# Function: scrubEmbeddedSecrets()

> **scrubEmbeddedSecrets**(`value`): `string`

Defined in: [privacy/redact.ts:163](https://github.com/limetry/limetry/blob/f14000dfffe19a47b41e78212d02a5eb934e0d18/packages/sdk/src/privacy/redact.ts#L163)

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
