[**Limetry v1.2.106**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / shouldFailHard

# Function: shouldFailHard()

> **shouldFailHard**(`source?`): `boolean`

Defined in: [env-runtime.ts:59](https://github.com/limetry/limetry/blob/177ce0a005d959d4fe84246d6472f9dda4bb7e04/packages/preflight/src/env-runtime.ts#L59)

Hard-fail only when a required check is actually blocking a live process.
Preview/build/test must still boot with warnings.

## Parameters

### source?

`ProcessEnv` = `process.env`

Injected env bag.

## Returns

`boolean`

`true` only for production runtimes outside test/build phases.
