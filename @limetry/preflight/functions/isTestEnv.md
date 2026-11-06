[**Limetry v1.2.85**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / isTestEnv

# Function: isTestEnv()

> **isTestEnv**(`source?`): `boolean`

Defined in: [env-runtime.ts:14](https://github.com/limetry/limetry/blob/a92c96e29b937113a9a42b230a461a37c4719e91/packages/preflight/src/env-runtime.ts#L14)

True in Vitest / `NODE_ENV=test` (connectivity usually skipped).

## Parameters

### source?

`ProcessEnv` = `process.env`

Injected env bag.

## Returns

`boolean`

Whether the process is a test runtime.
