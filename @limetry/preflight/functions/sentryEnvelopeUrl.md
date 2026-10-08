[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / sentryEnvelopeUrl

# Function: sentryEnvelopeUrl()

> **sentryEnvelopeUrl**(`dsn`): `string` \| `null`

Defined in: [probes/sentry.ts:50](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/preflight/src/probes/sentry.ts#L50)

Builds the Sentry ingest envelope URL for a DSN.

## Parameters

### dsn

`string`

Sentry DSN URL string.

## Returns

`string` \| `null`

Envelope URL, or `null` when the DSN is invalid.
