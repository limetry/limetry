[**Limetry v1.2.106**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / isNextBuildPhase

# Function: isNextBuildPhase()

> **isNextBuildPhase**(`source?`): `boolean`

Defined in: [env-runtime.ts:24](https://github.com/limetry/limetry/blob/177ce0a005d959d4fe84246d6472f9dda4bb7e04/packages/preflight/src/env-runtime.ts#L24)

True during Next production build/export or Limetry static portal export.

## Parameters

### source?

`ProcessEnv` = `process.env`

Injected env bag (`LIMETRY_STATIC_EXPORT`, `NEXT_PHASE`).

## Returns

`boolean`

Whether connectivity and fail-hard should be suppressed for build.
