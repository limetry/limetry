[**Limetry v1.2.55**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / ConnectivityProbe

# Type Alias: ConnectivityProbe

> **ConnectivityProbe** = `object`

Defined in: [types.ts:49](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/preflight/src/types.ts#L49)

Async connectivity check invoked by [runPreflight](../functions/runPreflight.md) when probing is enabled.

## Properties

### critical?

> `optional` **critical?**: `boolean`

Defined in: [types.ts:54](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/preflight/src/types.ts#L54)

When `required` is true, defaults to hard-fail. Set `false` to allow boot
with a degraded dependency.

***

### name

> **name**: `string`

Defined in: [types.ts:58](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/preflight/src/types.ts#L58)

Stable probe name used in the resulting [PreflightCheck](PreflightCheck.md).

***

### required

> **required**: `boolean`

Defined in: [types.ts:62](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/preflight/src/types.ts#L62)

Whether a failed probe can block startup under `failHard`.

***

### run

> **run**: () => `Promise`\<\{ `detail`: `string`; `ok`: `boolean`; \}\>

Defined in: [types.ts:68](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/preflight/src/types.ts#L68)

Executes the probe and returns a pass/fail detail string.

#### Returns

`Promise`\<\{ `detail`: `string`; `ok`: `boolean`; \}\>

Probe outcome used to build a connectivity [PreflightCheck](PreflightCheck.md).
