[**Limetry v1.2.80**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / resolveLimetryCloudBaseUrl

# Function: resolveLimetryCloudBaseUrl()

> **resolveLimetryCloudBaseUrl**(`source?`, `override?`): `string`

Defined in: [urls.ts:69](https://github.com/limetry/limetry/blob/a4abe7149ae07b5757f2fdd4b9ab51e2090b8264/packages/sdk/src/urls.ts#L69)

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
