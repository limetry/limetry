[**Limetry v1.2.106**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / probeReachableOrigin

# Function: probeReachableOrigin()

> **probeReachableOrigin**(`input`): `Promise`\<[`ProbeResult`](../type-aliases/ProbeResult.md)\>

Defined in: [probes/http.ts:75](https://github.com/limetry/limetry/blob/177ce0a005d959d4fe84246d6472f9dda4bb7e04/packages/preflight/src/probes/http.ts#L75)

Treats any HTTP response (including 4xx/5xx) as reachability. Network errors fail.

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

Probe result with status code when reachable.
