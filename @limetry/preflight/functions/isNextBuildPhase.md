[**Limetry v1.2.55**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / isNextBuildPhase

# Function: isNextBuildPhase()

> **isNextBuildPhase**(`source?`): `boolean`

Defined in: [env-runtime.ts:24](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/preflight/src/env-runtime.ts#L24)

True during Next production build/export or Limetry static portal export.

## Parameters

### source?

`ProcessEnv` = `process.env`

Injected env bag (`LIMETRY_STATIC_EXPORT`, `NEXT_PHASE`).

## Returns

`boolean`

Whether connectivity and fail-hard should be suppressed for build.
