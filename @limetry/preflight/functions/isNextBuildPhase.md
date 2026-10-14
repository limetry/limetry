[**Limetry v1.2.80**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / isNextBuildPhase

# Function: isNextBuildPhase()

> **isNextBuildPhase**(`source?`): `boolean`

Defined in: [env-runtime.ts:24](https://github.com/limetry/limetry/blob/a4abe7149ae07b5757f2fdd4b9ab51e2090b8264/packages/preflight/src/env-runtime.ts#L24)

True during Next production build/export or Limetry static portal export.

## Parameters

### source?

`ProcessEnv` = `process.env`

Injected env bag (`LIMETRY_STATIC_EXPORT`, `NEXT_PHASE`).

## Returns

`boolean`

Whether connectivity and fail-hard should be suppressed for build.
