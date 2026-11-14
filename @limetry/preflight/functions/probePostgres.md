[**Limetry v1.2.87**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / probePostgres

# Function: probePostgres()

> **probePostgres**(`url`, `timeoutMs?`): `Promise`\<[`ProbeResult`](../type-aliases/ProbeResult.md)\>

Defined in: [probes/postgres.ts:15](https://github.com/limetry/limetry/blob/f14000dfffe19a47b41e78212d02a5eb934e0d18/packages/preflight/src/probes/postgres.ts#L15)

Runs `SELECT 1` against Postgres. Requires optional peer `pg`.

## Parameters

### url

`string`

Postgres connection string.

### timeoutMs?

`number` = `DEFAULT_PROBE_TIMEOUT_MS`

Connection timeout in milliseconds (default DEFAULT\_PROBE\_TIMEOUT\_MS).

## Returns

`Promise`\<[`ProbeResult`](../type-aliases/ProbeResult.md)\>

Probe result; fails when `pg` is missing or the query errors.
