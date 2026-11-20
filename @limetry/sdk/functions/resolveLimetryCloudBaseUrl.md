[**Limetry v1.2.95**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / resolveLimetryCloudBaseUrl

# Function: resolveLimetryCloudBaseUrl()

> **resolveLimetryCloudBaseUrl**(`source?`, `override?`): `string`

Defined in: [urls.ts:69](https://github.com/limetry/limetry/blob/a7611e6e95f8c7e1ea98c503d1daeb65dbc76a3c/packages/sdk/src/urls.ts#L69)

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
