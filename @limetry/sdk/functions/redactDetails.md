[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / redactDetails

# Function: redactDetails()

> **redactDetails**(`details`): `Record`\<`string`, `unknown`\> \| `undefined`

Defined in: [privacy/redact.ts:108](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/privacy/redact.ts#L108)

Recursively redacts sensitive keys and scrubs string values in open JSON bags.

## Parameters

### details

`Record`\<`string`, `unknown`\> \| `undefined`

Optional open JSON object.

## Returns

`Record`\<`string`, `unknown`\> \| `undefined`

Redacted deep copy, or `undefined` when input is absent.
