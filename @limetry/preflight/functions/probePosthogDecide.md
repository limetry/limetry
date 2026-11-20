[**Limetry v1.2.95**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / probePosthogDecide

# Function: probePosthogDecide()

> **probePosthogDecide**(`input`): `Promise`\<[`ProbeResult`](../type-aliases/ProbeResult.md)\>

Defined in: [probes/posthog.ts:33](https://github.com/limetry/limetry/blob/a7611e6e95f8c7e1ea98c503d1daeb65dbc76a3c/packages/preflight/src/probes/posthog.ts#L33)

POSTs to PostHog `/decide/?v=3` to verify the project key and host.

## Parameters

### input

API key, optional host, timeout.

#### apiKey

`string`

#### host?

`string`

#### timeoutMs?

`number`

## Returns

`Promise`\<[`ProbeResult`](../type-aliases/ProbeResult.md)\>

Probe result; non-2xx fails (including 404).
