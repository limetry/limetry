[**Limetry v1.2.95**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / connectivityIcon

# Function: connectivityIcon()

> **connectivityIcon**(`check`): `string`

Defined in: [checks.ts:47](https://github.com/limetry/limetry/blob/a7611e6e95f8c7e1ea98c503d1daeb65dbc76a3c/packages/preflight/src/checks.ts#L47)

Banner icon for a check: pass, optional warn, required-degraded warn, or fail.

## Parameters

### check

`Pick`\<[`PreflightCheck`](../type-aliases/PreflightCheck.md), `"critical"` \| `"ok"` \| `"required"`\>

Severity fields from a [PreflightCheck](../type-aliases/PreflightCheck.md).

## Returns

`string`

Emoji status glyph for the banner line.
