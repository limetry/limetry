[**Limetry v1.2.87**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / probeSentryIngest

# Function: probeSentryIngest()

> **probeSentryIngest**(`dsn`, `timeoutMs?`): `Promise`\<[`ProbeResult`](../type-aliases/ProbeResult.md)\>

Defined in: [probes/sentry.ts:78](https://github.com/limetry/limetry/blob/f14000dfffe19a47b41e78212d02a5eb934e0d18/packages/preflight/src/probes/sentry.ts#L78)

POSTs a minimal envelope to verify ingest is reachable (DSN public key only).

## Parameters

### dsn

`string`

Sentry DSN used to derive the envelope URL and auth header.

### timeoutMs?

`number` = `DEFAULT_PROBE_TIMEOUT_MS`

Abort timeout.

## Returns

`Promise`\<[`ProbeResult`](../type-aliases/ProbeResult.md)\>

Probe result; 404 and 5xx fail.
