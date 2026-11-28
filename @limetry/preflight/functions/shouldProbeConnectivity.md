[**Limetry v1.2.106**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / shouldProbeConnectivity

# Function: shouldProbeConnectivity()

> **shouldProbeConnectivity**(`source?`): `boolean`

Defined in: [env-runtime.ts:48](https://github.com/limetry/limetry/blob/177ce0a005d959d4fe84246d6472f9dda4bb7e04/packages/preflight/src/env-runtime.ts#L48)

Whether connectivity probes should run for this env bag.

## Parameters

### source?

`ProcessEnv` = `process.env`

Injected env bag.

## Returns

`boolean`

`false` in test or Next build/export phases; otherwise `true`.
