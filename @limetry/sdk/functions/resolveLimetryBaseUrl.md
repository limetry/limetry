[**Limetry v1.2.87**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / resolveLimetryBaseUrl

# Function: resolveLimetryBaseUrl()

> **resolveLimetryBaseUrl**(`source?`, `override?`): `string`

Defined in: [urls.ts:49](https://github.com/limetry/limetry/blob/f14000dfffe19a47b41e78212d02a5eb934e0d18/packages/sdk/src/urls.ts#L49)

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
