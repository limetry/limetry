[**Limetry v1.2.80**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / redactDetails

# Function: redactDetails()

> **redactDetails**(`details`): `Record`\<`string`, `unknown`\> \| `undefined`

Defined in: [privacy/redact.ts:108](https://github.com/limetry/limetry/blob/a4abe7149ae07b5757f2fdd4b9ab51e2090b8264/packages/sdk/src/privacy/redact.ts#L108)

Recursively redacts sensitive keys and scrubs string values in open JSON bags.

## Parameters

### details

`Record`\<`string`, `unknown`\> \| `undefined`

Optional open JSON object.

## Returns

`Record`\<`string`, `unknown`\> \| `undefined`

Redacted deep copy, or `undefined` when input is absent.
