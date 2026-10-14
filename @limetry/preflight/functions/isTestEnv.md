[**Limetry v1.2.80**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / isTestEnv

# Function: isTestEnv()

> **isTestEnv**(`source?`): `boolean`

Defined in: [env-runtime.ts:14](https://github.com/limetry/limetry/blob/a4abe7149ae07b5757f2fdd4b9ab51e2090b8264/packages/preflight/src/env-runtime.ts#L14)

True in Vitest / `NODE_ENV=test` (connectivity usually skipped).

## Parameters

### source?

`ProcessEnv` = `process.env`

Injected env bag.

## Returns

`boolean`

Whether the process is a test runtime.
