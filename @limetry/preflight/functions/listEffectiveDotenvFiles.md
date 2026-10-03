[**Limetry v1.2.55**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / listEffectiveDotenvFiles

# Function: listEffectiveDotenvFiles()

> **listEffectiveDotenvFiles**(`source?`, `cwd?`): `string`

Defined in: [dotenv-files.ts:25](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/preflight/src/dotenv-files.ts#L25)

Human-readable list of dotenv files that dotenvx would load from `cwd` upward,
or a Vercel note when `source.VERCEL` is set.

## Parameters

### source?

`ProcessEnv` = `process.env`

Injected env bag (checks `VERCEL`); defaults to `process.env` at call site.

### cwd?

`string` = `...`

Starting directory for upward dotenv discovery; defaults to `process.cwd()`.

## Returns

`string`

Comma-separated relative paths, a Vercel note, or `"none (process.env only)"`.
