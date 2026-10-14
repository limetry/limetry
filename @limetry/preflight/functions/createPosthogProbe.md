[**Limetry v1.2.80**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / createPosthogProbe

# Function: createPosthogProbe()

> **createPosthogProbe**(`input`): [`ConnectivityProbe`](../type-aliases/ConnectivityProbe.md)

Defined in: [probes/posthog.ts:77](https://github.com/limetry/limetry/blob/a4abe7149ae07b5757f2fdd4b9ab51e2090b8264/packages/preflight/src/probes/posthog.ts#L77)

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
