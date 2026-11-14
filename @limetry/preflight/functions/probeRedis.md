[**Limetry v1.2.87**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / probeRedis

# Function: probeRedis()

> **probeRedis**(`url`, `timeoutMs?`): `Promise`\<[`ProbeResult`](../type-aliases/ProbeResult.md)\>

Defined in: [probes/redis.ts:15](https://github.com/limetry/limetry/blob/f14000dfffe19a47b41e78212d02a5eb934e0d18/packages/preflight/src/probes/redis.ts#L15)

Connects and `PING`s Redis. Requires optional peer `ioredis`.

## Parameters

### url

`string`

Redis connection URL.

### timeoutMs?

`number` = `DEFAULT_PROBE_TIMEOUT_MS`

Connect timeout in milliseconds (default DEFAULT\_PROBE\_TIMEOUT\_MS).

## Returns

`Promise`\<[`ProbeResult`](../type-aliases/ProbeResult.md)\>

Probe result; fails when `ioredis` is missing or ping errors.
