[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / parseSentryDsn

# Function: parseSentryDsn()

> **parseSentryDsn**(`dsn`): \{ `origin`: `string`; `projectId`: `string`; `publicKey`: `string`; \} \| `null`

Defined in: [probes/sentry.ts:27](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/preflight/src/probes/sentry.ts#L27)

Extracts ingest origin + project id from a Sentry DSN, or `null` if invalid.

## Parameters

### dsn

`string`

Sentry DSN URL string.

## Returns

\{ `origin`: `string`; `projectId`: `string`; `publicKey`: `string`; \} \| `null`

Origin and project id when the DSN has a username and project path segment.
