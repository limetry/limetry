[**Limetry v1.2.85**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / isProductionRuntime

# Function: isProductionRuntime()

> **isProductionRuntime**(`source?`): `boolean`

Defined in: [env-runtime.ts:38](https://github.com/limetry/limetry/blob/a92c96e29b937113a9a42b230a461a37c4719e91/packages/preflight/src/env-runtime.ts#L38)

True when the process is a production runtime (Node or Vercel Production).

## Parameters

### source?

`ProcessEnv` = `process.env`

Injected env bag (`NODE_ENV`, `VERCEL_ENV`).

## Returns

`boolean`

Whether production fail-hard policy should apply.
