[**Limetry v1.2.85**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / shouldProbeConnectivity

# Function: shouldProbeConnectivity()

> **shouldProbeConnectivity**(`source?`): `boolean`

Defined in: [env-runtime.ts:48](https://github.com/limetry/limetry/blob/a92c96e29b937113a9a42b230a461a37c4719e91/packages/preflight/src/env-runtime.ts#L48)

Whether connectivity probes should run for this env bag.

## Parameters

### source?

`ProcessEnv` = `process.env`

Injected env bag.

## Returns

`boolean`

`false` in test or Next build/export phases; otherwise `true`.
