[**Limetry v1.2.87**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / sentryEnvelopeUrl

# Function: sentryEnvelopeUrl()

> **sentryEnvelopeUrl**(`dsn`): `string` \| `null`

Defined in: [probes/sentry.ts:50](https://github.com/limetry/limetry/blob/f14000dfffe19a47b41e78212d02a5eb934e0d18/packages/preflight/src/probes/sentry.ts#L50)

Builds the Sentry ingest envelope URL for a DSN.

## Parameters

### dsn

`string`

Sentry DSN URL string.

## Returns

`string` \| `null`

Envelope URL, or `null` when the DSN is invalid.
