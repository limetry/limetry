[**Limetry v1.2.106**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / scrubEmbeddedSecrets

# Function: scrubEmbeddedSecrets()

> **scrubEmbeddedSecrets**(`value`): `string`

Defined in: [privacy/redact.ts:163](https://github.com/limetry/limetry/blob/177ce0a005d959d4fe84246d6472f9dda4bb7e04/packages/sdk/src/privacy/redact.ts#L163)

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
