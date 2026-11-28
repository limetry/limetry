[**Limetry v1.2.106**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / sentryEnvelopeUrl

# Function: sentryEnvelopeUrl()

> **sentryEnvelopeUrl**(`dsn`): `string` \| `null`

Defined in: [probes/sentry.ts:50](https://github.com/limetry/limetry/blob/177ce0a005d959d4fe84246d6472f9dda4bb7e04/packages/preflight/src/probes/sentry.ts#L50)

Builds the Sentry ingest envelope URL for a DSN.

## Parameters

### dsn

`string`

Sentry DSN URL string.

## Returns

`string` \| `null`

Envelope URL, or `null` when the DSN is invalid.
