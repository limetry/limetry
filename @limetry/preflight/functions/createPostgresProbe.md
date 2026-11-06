[**Limetry v1.2.85**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / createPostgresProbe

# Function: createPostgresProbe()

> **createPostgresProbe**(`input`): [`ConnectivityProbe`](../type-aliases/ConnectivityProbe.md)

Defined in: [probes/postgres.ts:60](https://github.com/limetry/limetry/blob/a92c96e29b937113a9a42b230a461a37c4719e91/packages/preflight/src/probes/postgres.ts#L60)

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
