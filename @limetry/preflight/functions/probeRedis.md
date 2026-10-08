[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / probeRedis

# Function: probeRedis()

> **probeRedis**(`url`, `timeoutMs?`): `Promise`\<[`ProbeResult`](../type-aliases/ProbeResult.md)\>

Defined in: [probes/redis.ts:15](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/preflight/src/probes/redis.ts#L15)

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
