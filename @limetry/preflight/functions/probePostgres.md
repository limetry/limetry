[**Limetry v1.2.55**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / probePostgres

# Function: probePostgres()

> **probePostgres**(`url`, `timeoutMs?`): `Promise`\<[`ProbeResult`](../type-aliases/ProbeResult.md)\>

Defined in: [probes/postgres.ts:15](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/preflight/src/probes/postgres.ts#L15)

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
