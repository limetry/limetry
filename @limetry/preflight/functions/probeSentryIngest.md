[**Limetry v1.2.55**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / probeSentryIngest

# Function: probeSentryIngest()

> **probeSentryIngest**(`dsn`, `timeoutMs?`): `Promise`\<[`ProbeResult`](../type-aliases/ProbeResult.md)\>

Defined in: [probes/sentry.ts:78](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/preflight/src/probes/sentry.ts#L78)

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
