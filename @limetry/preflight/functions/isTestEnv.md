[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / isTestEnv

# Function: isTestEnv()

> **isTestEnv**(`source?`): `boolean`

Defined in: [env-runtime.ts:14](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/preflight/src/env-runtime.ts#L14)

True in Vitest / `NODE_ENV=test` (connectivity usually skipped).

## Parameters

### source?

`ProcessEnv` = `process.env`

Injected env bag.

## Returns

`boolean`

Whether the process is a test runtime.
