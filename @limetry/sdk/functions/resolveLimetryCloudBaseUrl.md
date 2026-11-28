[**Limetry v1.2.106**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / resolveLimetryCloudBaseUrl

# Function: resolveLimetryCloudBaseUrl()

> **resolveLimetryCloudBaseUrl**(`source?`, `override?`): `string`

Defined in: [urls.ts:69](https://github.com/limetry/limetry/blob/177ce0a005d959d4fe84246d6472f9dda4bb7e04/packages/sdk/src/urls.ts#L69)

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
