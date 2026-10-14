[**Limetry v1.2.80**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / connectivityIcon

# Function: connectivityIcon()

> **connectivityIcon**(`check`): `string`

Defined in: [checks.ts:47](https://github.com/limetry/limetry/blob/a4abe7149ae07b5757f2fdd4b9ab51e2090b8264/packages/preflight/src/checks.ts#L47)

Banner icon for a check: pass, optional warn, required-degraded warn, or fail.

## Parameters

### check

`Pick`\<[`PreflightCheck`](../type-aliases/PreflightCheck.md), `"critical"` \| `"ok"` \| `"required"`\>

Severity fields from a [PreflightCheck](../type-aliases/PreflightCheck.md).

## Returns

`string`

Emoji status glyph for the banner line.
