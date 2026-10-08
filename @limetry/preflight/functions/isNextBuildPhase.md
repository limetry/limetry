[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / isNextBuildPhase

# Function: isNextBuildPhase()

> **isNextBuildPhase**(`source?`): `boolean`

Defined in: [env-runtime.ts:24](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/preflight/src/env-runtime.ts#L24)

True during Next production build/export or Limetry static portal export.

## Parameters

### source?

`ProcessEnv` = `process.env`

Injected env bag (`LIMETRY_STATIC_EXPORT`, `NEXT_PHASE`).

## Returns

`boolean`

Whether connectivity and fail-hard should be suppressed for build.
