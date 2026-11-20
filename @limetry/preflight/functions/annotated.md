[**Limetry v1.2.95**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / annotated

# Function: annotated()

> **annotated**(`name`, `display`, `source?`): `string`

Defined in: [dotenv-files.ts:57](https://github.com/limetry/limetry/blob/a7611e6e95f8c7e1ea98c503d1daeb65dbc76a3c/packages/preflight/src/dotenv-files.ts#L57)

Appends ` (from default)` when `name` is unset/blank on `source`.
Use for context lines that show resolved values that may not come from env.

## Parameters

### name

`string`

Env key to inspect on `source`.

### display

`string`

Display text for the resolved value.

### source?

`ProcessEnv` = `process.env`

Injected env bag; defaults to `process.env` at call site.

## Returns

`string`

`display`, optionally annotated when the key is unset.
