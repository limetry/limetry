[**Limetry v1.2.55**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / createRedisProbe

# Function: createRedisProbe()

> **createRedisProbe**(`input`): [`ConnectivityProbe`](../type-aliases/ConnectivityProbe.md)

Defined in: [probes/redis.ts:61](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/preflight/src/probes/redis.ts#L61)

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
