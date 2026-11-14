[**Limetry v1.2.87**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / shouldFailHard

# Function: shouldFailHard()

> **shouldFailHard**(`source?`): `boolean`

Defined in: [env-runtime.ts:59](https://github.com/limetry/limetry/blob/f14000dfffe19a47b41e78212d02a5eb934e0d18/packages/preflight/src/env-runtime.ts#L59)

Hard-fail only when a required check is actually blocking a live process.
Preview/build/test must still boot with warnings.

## Parameters

### source?

`ProcessEnv` = `process.env`

Injected env bag.

## Returns

`boolean`

`true` only for production runtimes outside test/build phases.
