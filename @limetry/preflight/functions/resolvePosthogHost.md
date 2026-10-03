[**Limetry v1.2.55**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / resolvePosthogHost

# Function: resolvePosthogHost()

> **resolvePosthogHost**(`host`): `string`

Defined in: [probes/posthog.ts:19](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/preflight/src/probes/posthog.ts#L19)

Normalizes a PostHog host URL (default US cloud).

## Parameters

### host

`string` \| `undefined`

Optional host override; blank/undefined uses the US cloud default.

## Returns

`string`

Absolute host origin without a trailing slash.
