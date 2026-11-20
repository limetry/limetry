[**Limetry v1.2.95**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / shouldFailHard

# Function: shouldFailHard()

> **shouldFailHard**(`source?`): `boolean`

Defined in: [env-runtime.ts:59](https://github.com/limetry/limetry/blob/a7611e6e95f8c7e1ea98c503d1daeb65dbc76a3c/packages/preflight/src/env-runtime.ts#L59)

Hard-fail only when a required check is actually blocking a live process.
Preview/build/test must still boot with warnings.

## Parameters

### source?

`ProcessEnv` = `process.env`

Injected env bag.

## Returns

`boolean`

`true` only for production runtimes outside test/build phases.
