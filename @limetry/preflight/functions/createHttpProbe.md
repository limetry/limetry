[**Limetry v1.2.87**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / createHttpProbe

# Function: createHttpProbe()

> **createHttpProbe**(`input`): [`ConnectivityProbe`](../type-aliases/ConnectivityProbe.md)

Defined in: [probes/http.ts:111](https://github.com/limetry/limetry/blob/f14000dfffe19a47b41e78212d02a5eb934e0d18/packages/preflight/src/probes/http.ts#L111)

Wraps [probeHttp](probeHttp.md) as a [ConnectivityProbe](../type-aliases/ConnectivityProbe.md), optionally retrying
transient failures (useful when a sibling process is still booting).

## Parameters

### input

Probe identity plus [probeHttp](probeHttp.md) options.

#### critical?

`boolean`

#### failure

`string`

#### headers?

[`HttpHeaders`](../type-aliases/HttpHeaders.md)

#### method?

`string`

#### name

`string`

#### required

`boolean`

#### retries?

`number`

#### retryDelayMs?

`number`

#### success

`string`

#### timeoutMs?

`number`

#### url

`string`

## Returns

[`ConnectivityProbe`](../type-aliases/ConnectivityProbe.md)

Connectivity probe suitable for `runPreflight`.
