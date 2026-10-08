[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / connectivityIcon

# Function: connectivityIcon()

> **connectivityIcon**(`check`): `string`

Defined in: [checks.ts:47](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/preflight/src/checks.ts#L47)

Banner icon for a check: pass, optional warn, required-degraded warn, or fail.

## Parameters

### check

`Pick`\<[`PreflightCheck`](../type-aliases/PreflightCheck.md), `"critical"` \| `"ok"` \| `"required"`\>

Severity fields from a [PreflightCheck](../type-aliases/PreflightCheck.md).

## Returns

`string`

Emoji status glyph for the banner line.
