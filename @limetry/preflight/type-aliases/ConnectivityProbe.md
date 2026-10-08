[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / ConnectivityProbe

# Type Alias: ConnectivityProbe

> **ConnectivityProbe** = `object`

Defined in: [types.ts:49](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/preflight/src/types.ts#L49)

Async connectivity check invoked by [runPreflight](../functions/runPreflight.md) when probing is enabled.

## Properties

### critical?

> `optional` **critical?**: `boolean`

Defined in: [types.ts:54](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/preflight/src/types.ts#L54)

When `required` is true, defaults to hard-fail. Set `false` to allow boot
with a degraded dependency.

***

### name

> **name**: `string`

Defined in: [types.ts:58](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/preflight/src/types.ts#L58)

Stable probe name used in the resulting [PreflightCheck](PreflightCheck.md).

***

### required

> **required**: `boolean`

Defined in: [types.ts:62](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/preflight/src/types.ts#L62)

Whether a failed probe can block startup under `failHard`.

***

### run

> **run**: () => `Promise`\<\{ `detail`: `string`; `ok`: `boolean`; \}\>

Defined in: [types.ts:68](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/preflight/src/types.ts#L68)

Executes the probe and returns a pass/fail detail string.

#### Returns

`Promise`\<\{ `detail`: `string`; `ok`: `boolean`; \}\>

Probe outcome used to build a connectivity [PreflightCheck](PreflightCheck.md).
