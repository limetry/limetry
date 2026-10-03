[**Limetry v1.2.55**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / isTestEnv

# Function: isTestEnv()

> **isTestEnv**(`source?`): `boolean`

Defined in: [env-runtime.ts:14](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/preflight/src/env-runtime.ts#L14)

True in Vitest / `NODE_ENV=test` (connectivity usually skipped).

## Parameters

### source?

`ProcessEnv` = `process.env`

Injected env bag.

## Returns

`boolean`

Whether the process is a test runtime.
