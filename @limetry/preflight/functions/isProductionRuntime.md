[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / isProductionRuntime

# Function: isProductionRuntime()

> **isProductionRuntime**(`source?`): `boolean`

Defined in: [env-runtime.ts:38](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/preflight/src/env-runtime.ts#L38)

True when the process is a production runtime (Node or Vercel Production).

## Parameters

### source?

`ProcessEnv` = `process.env`

Injected env bag (`NODE_ENV`, `VERCEL_ENV`).

## Returns

`boolean`

Whether production fail-hard policy should apply.
