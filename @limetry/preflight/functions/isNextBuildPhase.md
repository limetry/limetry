[**Limetry v1.2.95**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / isNextBuildPhase

# Function: isNextBuildPhase()

> **isNextBuildPhase**(`source?`): `boolean`

Defined in: [env-runtime.ts:24](https://github.com/limetry/limetry/blob/a7611e6e95f8c7e1ea98c503d1daeb65dbc76a3c/packages/preflight/src/env-runtime.ts#L24)

True during Next production build/export or Limetry static portal export.

## Parameters

### source?

`ProcessEnv` = `process.env`

Injected env bag (`LIMETRY_STATIC_EXPORT`, `NEXT_PHASE`).

## Returns

`boolean`

Whether connectivity and fail-hard should be suppressed for build.
