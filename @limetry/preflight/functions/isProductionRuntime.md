[**Limetry v1.2.95**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / isProductionRuntime

# Function: isProductionRuntime()

> **isProductionRuntime**(`source?`): `boolean`

Defined in: [env-runtime.ts:38](https://github.com/limetry/limetry/blob/a7611e6e95f8c7e1ea98c503d1daeb65dbc76a3c/packages/preflight/src/env-runtime.ts#L38)

True when the process is a production runtime (Node or Vercel Production).

## Parameters

### source?

`ProcessEnv` = `process.env`

Injected env bag (`NODE_ENV`, `VERCEL_ENV`).

## Returns

`boolean`

Whether production fail-hard policy should apply.
