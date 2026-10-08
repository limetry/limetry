[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / createPosthogProbe

# Function: createPosthogProbe()

> **createPosthogProbe**(`input`): [`ConnectivityProbe`](../type-aliases/ConnectivityProbe.md)

Defined in: [probes/posthog.ts:77](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/preflight/src/probes/posthog.ts#L77)

Optional PostHog `/decide` reachability probe.

## Parameters

### input

API key, host override, and severity flags.

#### apiKey

`string`

#### host?

`string`

#### required?

`boolean`

## Returns

[`ConnectivityProbe`](../type-aliases/ConnectivityProbe.md)

Named `"posthog"` connectivity probe.
