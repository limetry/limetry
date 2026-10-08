[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / probeHttp

# Function: probeHttp()

> **probeHttp**(`input`): `Promise`\<[`ProbeResult`](../type-aliases/ProbeResult.md)\>

Defined in: [probes/http.ts:33](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/preflight/src/probes/http.ts#L33)

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
