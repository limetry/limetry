[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / createRedisProbe

# Function: createRedisProbe()

> **createRedisProbe**(`input`): [`ConnectivityProbe`](../type-aliases/ConnectivityProbe.md)

Defined in: [probes/redis.ts:61](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/preflight/src/probes/redis.ts#L61)

Wraps [probeRedis](probeRedis.md) as a [ConnectivityProbe](../type-aliases/ConnectivityProbe.md).

## Parameters

### input

Connection URL and severity flags.

#### critical?

`boolean`

#### required

`boolean`

#### timeoutMs?

`number`

#### url

`string`

## Returns

[`ConnectivityProbe`](../type-aliases/ConnectivityProbe.md)

Named `"redis"` connectivity probe.
