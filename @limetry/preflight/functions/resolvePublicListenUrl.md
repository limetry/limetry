[**Limetry v1.2.87**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / resolvePublicListenUrl

# Function: resolvePublicListenUrl()

> **resolvePublicListenUrl**(`fallback`, `source?`): `string`

Defined in: [listen-urls.ts:88](https://github.com/limetry/limetry/blob/f14000dfffe19a47b41e78212d02a5eb934e0d18/packages/preflight/src/listen-urls.ts#L88)

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
