[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / resolveLimetryCloudBaseUrl

# Function: resolveLimetryCloudBaseUrl()

> **resolveLimetryCloudBaseUrl**(`source?`, `override?`): `string`

Defined in: [urls.ts:69](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/urls.ts#L69)

Resolves the Limetry Cloud BFF base URL from env or production default.

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
