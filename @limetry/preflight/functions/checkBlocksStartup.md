[**Limetry v1.2.106**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / checkBlocksStartup

# Function: checkBlocksStartup()

> **checkBlocksStartup**(`check`): `boolean`

Defined in: [types.ts:91](https://github.com/limetry/limetry/blob/177ce0a005d959d4fe84246d6472f9dda4bb7e04/packages/preflight/src/types.ts#L91)

Whether a failed check should abort the process under `failHard`.

## Parameters

### check

`Pick`\<[`PreflightCheck`](../type-aliases/PreflightCheck.md), `"critical"` \| `"ok"` \| `"required"`\>

Subset of a [PreflightCheck](../type-aliases/PreflightCheck.md) used for severity decisions.

## Returns

`boolean`

`true` when the check is required, not ok, and not explicitly non-critical.
