[**Limetry v1.2.106**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / resolvePosthogHost

# Function: resolvePosthogHost()

> **resolvePosthogHost**(`host`): `string`

Defined in: [probes/posthog.ts:19](https://github.com/limetry/limetry/blob/177ce0a005d959d4fe84246d6472f9dda4bb7e04/packages/preflight/src/probes/posthog.ts#L19)

Normalizes a PostHog host URL (default US cloud).

## Parameters

### host

`string` \| `undefined`

Optional host override; blank/undefined uses the US cloud default.

## Returns

`string`

Absolute host origin without a trailing slash.
