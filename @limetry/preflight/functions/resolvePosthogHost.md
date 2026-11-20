[**Limetry v1.2.95**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / resolvePosthogHost

# Function: resolvePosthogHost()

> **resolvePosthogHost**(`host`): `string`

Defined in: [probes/posthog.ts:19](https://github.com/limetry/limetry/blob/a7611e6e95f8c7e1ea98c503d1daeb65dbc76a3c/packages/preflight/src/probes/posthog.ts#L19)

Normalizes a PostHog host URL (default US cloud).

## Parameters

### host

`string` \| `undefined`

Optional host override; blank/undefined uses the US cloud default.

## Returns

`string`

Absolute host origin without a trailing slash.
