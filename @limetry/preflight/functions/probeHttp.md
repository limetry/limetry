[**Limetry v1.2.106**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / probeHttp

# Function: probeHttp()

> **probeHttp**(`input`): `Promise`\<[`ProbeResult`](../type-aliases/ProbeResult.md)\>

Defined in: [probes/http.ts:33](https://github.com/limetry/limetry/blob/177ce0a005d959d4fe84246d6472f9dda4bb7e04/packages/preflight/src/probes/http.ts#L33)

GET/HEAD-style probe that treats only 2xx as success.

## Parameters

### input

Target URL and success/failure detail templates.

#### failure

`string`

#### headers?

[`HttpHeaders`](../type-aliases/HttpHeaders.md)

#### method?

`string`

#### success

`string`

#### timeoutMs?

`number`

#### url

`string`

## Returns

`Promise`\<[`ProbeResult`](../type-aliases/ProbeResult.md)\>

Probe result with elapsed timing in `detail`.
