[**Limetry v1.2.87**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / redactDetails

# Function: redactDetails()

> **redactDetails**(`details`): `Record`\<`string`, `unknown`\> \| `undefined`

Defined in: [privacy/redact.ts:108](https://github.com/limetry/limetry/blob/f14000dfffe19a47b41e78212d02a5eb934e0d18/packages/sdk/src/privacy/redact.ts#L108)

Recursively redacts sensitive keys and scrubs string values in open JSON bags.

## Parameters

### details

`Record`\<`string`, `unknown`\> \| `undefined`

Optional open JSON object.

## Returns

`Record`\<`string`, `unknown`\> \| `undefined`

Redacted deep copy, or `undefined` when input is absent.
