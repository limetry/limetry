[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / createPostgresProbe

# Function: createPostgresProbe()

> **createPostgresProbe**(`input`): [`ConnectivityProbe`](../type-aliases/ConnectivityProbe.md)

Defined in: [probes/postgres.ts:60](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/preflight/src/probes/postgres.ts#L60)

Wraps [probePostgres](probePostgres.md) as a [ConnectivityProbe](../type-aliases/ConnectivityProbe.md).

## Parameters

### input

Connection options: `url` (Postgres connection string), `required` (whether
  failure can block startup), optional `critical` (hard-fail override when required), and
  optional `timeoutMs` (connection timeout forwarded to [probePostgres](probePostgres.md)).

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

Named `"postgres"` connectivity probe.
