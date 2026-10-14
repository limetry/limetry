[**Limetry v1.2.80**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / probeHttp

# Function: probeHttp()

> **probeHttp**(`input`): `Promise`\<[`ProbeResult`](../type-aliases/ProbeResult.md)\>

Defined in: [probes/http.ts:33](https://github.com/limetry/limetry/blob/a4abe7149ae07b5757f2fdd4b9ab51e2090b8264/packages/preflight/src/probes/http.ts#L33)

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
