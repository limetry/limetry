[**Limetry v1.2.55**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / envCheck

# Function: envCheck()

> **envCheck**(`input`): [`PreflightCheck`](../type-aliases/PreflightCheck.md)

Defined in: [checks.ts:18](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/preflight/src/checks.ts#L18)

Builds a [PreflightCheck](../type-aliases/PreflightCheck.md) for an environment variable or secret.

Pass `value` for masking/display; use `display` to override the shown text
(e.g. same-origin proxy labels). Prefer values from a typed product env
object rather than ambient `process.env` at the adapter layer.

## Parameters

### input

Check fields and optional display/masking overrides.

#### critical?

`boolean`

#### display?

`string`

#### kind?

[`PreflightCheckKind`](../type-aliases/PreflightCheckKind.md)

#### name

`string`

#### ok

`boolean`

#### required

`boolean`

#### secret?

`boolean`

#### value?

`string`

## Returns

[`PreflightCheck`](../type-aliases/PreflightCheck.md)

A fully formed [PreflightCheck](../type-aliases/PreflightCheck.md) ready for `runPreflight`.
