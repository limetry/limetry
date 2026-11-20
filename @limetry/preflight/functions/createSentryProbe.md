[**Limetry v1.2.95**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / createSentryProbe

# Function: createSentryProbe()

> **createSentryProbe**(`input`): [`ConnectivityProbe`](../type-aliases/ConnectivityProbe.md) \| `null`

Defined in: [probes/sentry.ts:127](https://github.com/limetry/limetry/blob/a7611e6e95f8c7e1ea98c503d1daeb65dbc76a3c/packages/preflight/src/probes/sentry.ts#L127)

Optional Sentry reachability probe from a DSN. Returns `null` when DSN is invalid.

## Parameters

### input

DSN and optional required flag.

#### dsn

`string`

#### required?

`boolean`

## Returns

[`ConnectivityProbe`](../type-aliases/ConnectivityProbe.md) \| `null`

Named `"sentry"` probe, or `null` when the DSN cannot be parsed.
