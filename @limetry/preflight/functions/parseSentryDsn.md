[**Limetry v1.2.106**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / parseSentryDsn

# Function: parseSentryDsn()

> **parseSentryDsn**(`dsn`): \{ `origin`: `string`; `projectId`: `string`; `publicKey`: `string`; \} \| `null`

Defined in: [probes/sentry.ts:27](https://github.com/limetry/limetry/blob/177ce0a005d959d4fe84246d6472f9dda4bb7e04/packages/preflight/src/probes/sentry.ts#L27)

Extracts ingest origin + project id from a Sentry DSN, or `null` if invalid.

## Parameters

### dsn

`string`

Sentry DSN URL string.

## Returns

\{ `origin`: `string`; `projectId`: `string`; `publicKey`: `string`; \} \| `null`

Origin and project id when the DSN has a username and project path segment.
