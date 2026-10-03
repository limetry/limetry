[**Limetry v1.2.55**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / resolvePublicListenUrl

# Function: resolvePublicListenUrl()

> **resolvePublicListenUrl**(`fallback`, `source?`): `string`

Defined in: [listen-urls.ts:88](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/preflight/src/listen-urls.ts#L88)

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
