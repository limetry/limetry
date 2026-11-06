[**Limetry v1.2.85**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / shouldFailHard

# Function: shouldFailHard()

> **shouldFailHard**(`source?`): `boolean`

Defined in: [env-runtime.ts:59](https://github.com/limetry/limetry/blob/a92c96e29b937113a9a42b230a461a37c4719e91/packages/preflight/src/env-runtime.ts#L59)

Hard-fail only when a required check is actually blocking a live process.
Preview/build/test must still boot with warnings.

## Parameters

### source?

`ProcessEnv` = `process.env`

Injected env bag.

## Returns

`boolean`

`true` only for production runtimes outside test/build phases.
