[**Limetry v1.2.106**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / probePosthogDecide

# Function: probePosthogDecide()

> **probePosthogDecide**(`input`): `Promise`\<[`ProbeResult`](../type-aliases/ProbeResult.md)\>

Defined in: [probes/posthog.ts:33](https://github.com/limetry/limetry/blob/177ce0a005d959d4fe84246d6472f9dda4bb7e04/packages/preflight/src/probes/posthog.ts#L33)

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
