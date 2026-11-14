[**Limetry v1.2.87**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / isProductionRuntime

# Function: isProductionRuntime()

> **isProductionRuntime**(`source?`): `boolean`

Defined in: [env-runtime.ts:38](https://github.com/limetry/limetry/blob/f14000dfffe19a47b41e78212d02a5eb934e0d18/packages/preflight/src/env-runtime.ts#L38)

True when the process is a production runtime (Node or Vercel Production).

## Parameters

### source?

`ProcessEnv` = `process.env`

Injected env bag (`NODE_ENV`, `VERCEL_ENV`).

## Returns

`boolean`

Whether production fail-hard policy should apply.
