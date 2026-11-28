[**Limetry v1.2.106**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / createSentryProbe

# Function: createSentryProbe()

> **createSentryProbe**(`input`): [`ConnectivityProbe`](../type-aliases/ConnectivityProbe.md) \| `null`

Defined in: [probes/sentry.ts:127](https://github.com/limetry/limetry/blob/177ce0a005d959d4fe84246d6472f9dda4bb7e04/packages/preflight/src/probes/sentry.ts#L127)

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
