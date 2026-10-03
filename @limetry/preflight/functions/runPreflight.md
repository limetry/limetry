[**Limetry v1.2.55**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / runPreflight

# Function: runPreflight()

> **runPreflight**(`options`): `Promise`\<[`PreflightCheck`](../type-aliases/PreflightCheck.md)[]\>

Defined in: [run.ts:77](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/preflight/src/run.ts#L77)

Runs env checks + optional connectivity probes, prints the banner, and throws
when blocking required checks fail under `failHard`.

Side effects: writes structured preflight logs (banner + `preflight.complete`).

## Parameters

### options

[`RunPreflightOptions`](../type-aliases/RunPreflightOptions.md)

Product name, checks, probes, and runtime policy overrides.

## Returns

`Promise`\<[`PreflightCheck`](../type-aliases/PreflightCheck.md)[]\>

All env and connectivity [PreflightCheck](../type-aliases/PreflightCheck.md) rows evaluated.

## Throws

Error When one or more blocking required checks fail and `failHard` is true.
