[**Limetry v1.2.80**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / sentryEnvelopeUrl

# Function: sentryEnvelopeUrl()

> **sentryEnvelopeUrl**(`dsn`): `string` \| `null`

Defined in: [probes/sentry.ts:50](https://github.com/limetry/limetry/blob/a4abe7149ae07b5757f2fdd4b9ab51e2090b8264/packages/preflight/src/probes/sentry.ts#L50)

Builds the Sentry ingest envelope URL for a DSN.

## Parameters

### dsn

`string`

Sentry DSN URL string.

## Returns

`string` \| `null`

Envelope URL, or `null` when the DSN is invalid.
