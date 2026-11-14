[**Limetry v1.2.87**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / createSentryProbe

# Function: createSentryProbe()

> **createSentryProbe**(`input`): [`ConnectivityProbe`](../type-aliases/ConnectivityProbe.md) \| `null`

Defined in: [probes/sentry.ts:127](https://github.com/limetry/limetry/blob/f14000dfffe19a47b41e78212d02a5eb934e0d18/packages/preflight/src/probes/sentry.ts#L127)

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
