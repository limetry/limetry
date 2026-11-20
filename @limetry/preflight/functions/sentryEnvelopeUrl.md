[**Limetry v1.2.95**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / sentryEnvelopeUrl

# Function: sentryEnvelopeUrl()

> **sentryEnvelopeUrl**(`dsn`): `string` \| `null`

Defined in: [probes/sentry.ts:50](https://github.com/limetry/limetry/blob/a7611e6e95f8c7e1ea98c503d1daeb65dbc76a3c/packages/preflight/src/probes/sentry.ts#L50)

Builds the Sentry ingest envelope URL for a DSN.

## Parameters

### dsn

`string`

Sentry DSN URL string.

## Returns

`string` \| `null`

Envelope URL, or `null` when the DSN is invalid.
