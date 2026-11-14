[**Limetry v1.2.87**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / resolvePosthogHost

# Function: resolvePosthogHost()

> **resolvePosthogHost**(`host`): `string`

Defined in: [probes/posthog.ts:19](https://github.com/limetry/limetry/blob/f14000dfffe19a47b41e78212d02a5eb934e0d18/packages/preflight/src/probes/posthog.ts#L19)

Normalizes a PostHog host URL (default US cloud).

## Parameters

### host

`string` \| `undefined`

Optional host override; blank/undefined uses the US cloud default.

## Returns

`string`

Absolute host origin without a trailing slash.
