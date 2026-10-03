[**Limetry v1.2.55**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / createPosthogProbe

# Function: createPosthogProbe()

> **createPosthogProbe**(`input`): [`ConnectivityProbe`](../type-aliases/ConnectivityProbe.md)

Defined in: [probes/posthog.ts:77](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/preflight/src/probes/posthog.ts#L77)

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
