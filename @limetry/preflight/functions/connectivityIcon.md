[**Limetry v1.2.55**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / connectivityIcon

# Function: connectivityIcon()

> **connectivityIcon**(`check`): `string`

Defined in: [checks.ts:47](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/preflight/src/checks.ts#L47)

Banner icon for a check: pass, optional warn, required-degraded warn, or fail.

## Parameters

### check

`Pick`\<[`PreflightCheck`](../type-aliases/PreflightCheck.md), `"critical"` \| `"ok"` \| `"required"`\>

Severity fields from a [PreflightCheck](../type-aliases/PreflightCheck.md).

## Returns

`string`

Emoji status glyph for the banner line.
