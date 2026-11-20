[**Limetry v1.2.95**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / shouldProbeConnectivity

# Function: shouldProbeConnectivity()

> **shouldProbeConnectivity**(`source?`): `boolean`

Defined in: [env-runtime.ts:48](https://github.com/limetry/limetry/blob/a7611e6e95f8c7e1ea98c503d1daeb65dbc76a3c/packages/preflight/src/env-runtime.ts#L48)

Whether connectivity probes should run for this env bag.

## Parameters

### source?

`ProcessEnv` = `process.env`

Injected env bag.

## Returns

`boolean`

`false` in test or Next build/export phases; otherwise `true`.
