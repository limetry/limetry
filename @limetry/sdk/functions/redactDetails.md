[**Limetry v1.2.85**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / redactDetails

# Function: redactDetails()

> **redactDetails**(`details`): `Record`\<`string`, `unknown`\> \| `undefined`

Defined in: [privacy/redact.ts:108](https://github.com/limetry/limetry/blob/a92c96e29b937113a9a42b230a461a37c4719e91/packages/sdk/src/privacy/redact.ts#L108)

Recursively redacts sensitive keys and scrubs string values in open JSON bags.

## Parameters

### details

`Record`\<`string`, `unknown`\> \| `undefined`

Optional open JSON object.

## Returns

`Record`\<`string`, `unknown`\> \| `undefined`

Redacted deep copy, or `undefined` when input is absent.
