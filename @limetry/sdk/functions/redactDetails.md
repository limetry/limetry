[**Limetry v1.2.55**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / redactDetails

# Function: redactDetails()

> **redactDetails**(`details`): `Record`\<`string`, `unknown`\> \| `undefined`

Defined in: [privacy/redact.ts:108](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/privacy/redact.ts#L108)

Recursively redacts sensitive keys and scrubs string values in open JSON bags.

## Parameters

### details

`Record`\<`string`, `unknown`\> \| `undefined`

Optional open JSON object.

## Returns

`Record`\<`string`, `unknown`\> \| `undefined`

Redacted deep copy, or `undefined` when input is absent.
