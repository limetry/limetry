[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / shouldProbeConnectivity

# Function: shouldProbeConnectivity()

> **shouldProbeConnectivity**(`source?`): `boolean`

Defined in: [env-runtime.ts:48](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/preflight/src/env-runtime.ts#L48)

Whether connectivity probes should run for this env bag.

## Parameters

### source?

`ProcessEnv` = `process.env`

Injected env bag.

## Returns

`boolean`

`false` in test or Next build/export phases; otherwise `true`.
