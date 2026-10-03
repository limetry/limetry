[**Limetry v1.2.55**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / shouldProbeConnectivity

# Function: shouldProbeConnectivity()

> **shouldProbeConnectivity**(`source?`): `boolean`

Defined in: [env-runtime.ts:48](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/preflight/src/env-runtime.ts#L48)

Whether connectivity probes should run for this env bag.

## Parameters

### source?

`ProcessEnv` = `process.env`

Injected env bag.

## Returns

`boolean`

`false` in test or Next build/export phases; otherwise `true`.
