[**Limetry v1.2.80**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / resolveLimetryBaseUrl

# Function: resolveLimetryBaseUrl()

> **resolveLimetryBaseUrl**(`source?`, `override?`): `string`

Defined in: [urls.ts:49](https://github.com/limetry/limetry/blob/a4abe7149ae07b5757f2fdd4b9ab51e2090b8264/packages/sdk/src/urls.ts#L49)

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
