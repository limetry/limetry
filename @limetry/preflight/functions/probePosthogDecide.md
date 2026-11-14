[**Limetry v1.2.87**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / probePosthogDecide

# Function: probePosthogDecide()

> **probePosthogDecide**(`input`): `Promise`\<[`ProbeResult`](../type-aliases/ProbeResult.md)\>

Defined in: [probes/posthog.ts:33](https://github.com/limetry/limetry/blob/f14000dfffe19a47b41e78212d02a5eb934e0d18/packages/preflight/src/probes/posthog.ts#L33)

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
