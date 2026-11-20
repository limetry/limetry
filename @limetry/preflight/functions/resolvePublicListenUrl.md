[**Limetry v1.2.95**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / resolvePublicListenUrl

# Function: resolvePublicListenUrl()

> **resolvePublicListenUrl**(`fallback`, `source?`): `string`

Defined in: [listen-urls.ts:88](https://github.com/limetry/limetry/blob/a7611e6e95f8c7e1ea98c503d1daeb65dbc76a3c/packages/preflight/src/listen-urls.ts#L88)

Prefer Vercel production/preview host from `source`, else `fallback`.

## Parameters

### fallback

`string`

URL used when no Vercel host env vars are present.

### source?

`ProcessEnv` = `process.env`

Injected env bag; read `VERCEL_*` from it only (not ambient process.env).

## Returns

`string`

Absolute public HTTPS (or existing scheme) listen URL.
