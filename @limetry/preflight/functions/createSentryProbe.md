[**Limetry v1.2.80**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / createSentryProbe

# Function: createSentryProbe()

> **createSentryProbe**(`input`): [`ConnectivityProbe`](../type-aliases/ConnectivityProbe.md) \| `null`

Defined in: [probes/sentry.ts:127](https://github.com/limetry/limetry/blob/a4abe7149ae07b5757f2fdd4b9ab51e2090b8264/packages/preflight/src/probes/sentry.ts#L127)

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
