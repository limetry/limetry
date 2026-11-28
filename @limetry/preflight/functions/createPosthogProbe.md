[**Limetry v1.2.106**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / createPosthogProbe

# Function: createPosthogProbe()

> **createPosthogProbe**(`input`): [`ConnectivityProbe`](../type-aliases/ConnectivityProbe.md)

Defined in: [probes/posthog.ts:77](https://github.com/limetry/limetry/blob/177ce0a005d959d4fe84246d6472f9dda4bb7e04/packages/preflight/src/probes/posthog.ts#L77)

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
