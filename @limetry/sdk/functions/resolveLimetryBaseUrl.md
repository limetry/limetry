[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / resolveLimetryBaseUrl

# Function: resolveLimetryBaseUrl()

> **resolveLimetryBaseUrl**(`source?`, `override?`): `string`

Defined in: [urls.ts:49](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/urls.ts#L49)

Resolves the Limetry API base URL from env or OSS production default.

## Parameters

### source?

`ProcessEnv` = `process.env`

Environment map; defaults to `process.env`.

### override?

`string`

Explicit base URL that wins over env.

## Returns

`string`

Origin without a trailing slash.
