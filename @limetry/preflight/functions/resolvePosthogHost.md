[**Limetry v1.2.80**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / resolvePosthogHost

# Function: resolvePosthogHost()

> **resolvePosthogHost**(`host`): `string`

Defined in: [probes/posthog.ts:19](https://github.com/limetry/limetry/blob/a4abe7149ae07b5757f2fdd4b9ab51e2090b8264/packages/preflight/src/probes/posthog.ts#L19)

Normalizes a PostHog host URL (default US cloud).

## Parameters

### host

`string` \| `undefined`

Optional host override; blank/undefined uses the US cloud default.

## Returns

`string`

Absolute host origin without a trailing slash.
