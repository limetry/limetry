[**Limetry v1.2.106**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / isProductionRuntime

# Function: isProductionRuntime()

> **isProductionRuntime**(`source?`): `boolean`

Defined in: [env-runtime.ts:38](https://github.com/limetry/limetry/blob/177ce0a005d959d4fe84246d6472f9dda4bb7e04/packages/preflight/src/env-runtime.ts#L38)

True when the process is a production runtime (Node or Vercel Production).

## Parameters

### source?

`ProcessEnv` = `process.env`

Injected env bag (`NODE_ENV`, `VERCEL_ENV`).

## Returns

`boolean`

Whether production fail-hard policy should apply.
