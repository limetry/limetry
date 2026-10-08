[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / isSentryIngestReachableStatus

# Function: isSentryIngestReachableStatus()

> **isSentryIngestReachableStatus**(`status`): `boolean`

Defined in: [probes/sentry.ts:67](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/preflight/src/probes/sentry.ts#L67)

Returns true when an envelope response proves ingest is reachable.

Accepts 2xx–4xx except 404 (wrong project / missing route). Rejects 5xx and
network errors. Prefer HTTP 200 via MINIMAL\_ENVELOPE\_BODY.

## Parameters

### status

`number`

HTTP status from the envelope POST.

## Returns

`boolean`

Whether the status counts as reachable.
