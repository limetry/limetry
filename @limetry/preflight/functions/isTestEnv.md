[**Limetry v1.2.95**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / isTestEnv

# Function: isTestEnv()

> **isTestEnv**(`source?`): `boolean`

Defined in: [env-runtime.ts:14](https://github.com/limetry/limetry/blob/a7611e6e95f8c7e1ea98c503d1daeb65dbc76a3c/packages/preflight/src/env-runtime.ts#L14)

True in Vitest / `NODE_ENV=test` (connectivity usually skipped).

## Parameters

### source?

`ProcessEnv` = `process.env`

Injected env bag.

## Returns

`boolean`

Whether the process is a test runtime.
