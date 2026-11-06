[**Limetry v1.2.85**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / resolveLimetryBaseUrl

# Function: resolveLimetryBaseUrl()

> **resolveLimetryBaseUrl**(`source?`, `override?`): `string`

Defined in: [urls.ts:49](https://github.com/limetry/limetry/blob/a92c96e29b937113a9a42b230a461a37c4719e91/packages/sdk/src/urls.ts#L49)

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
