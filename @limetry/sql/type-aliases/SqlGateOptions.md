[**Limetry v1.2.55**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sql](../README.md) / SqlGateOptions

# Type Alias: SqlGateOptions

> **SqlGateOptions** = `object`

Defined in: [gate.ts:24](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sql/src/gate.ts#L24)

Construction options for [SqlActionGate](../classes/SqlActionGate.md).

## Properties

### agentId?

> `optional` **agentId?**: `string`

Defined in: [gate.ts:48](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sql/src/gate.ts#L48)

Agent id recorded on intents; defaults to `sql_agent`.

***

### apiKey

> **apiKey**: `string`

Defined in: [gate.ts:32](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sql/src/gate.ts#L32)

Limetry API key / bearer token.

***

### baseUrl?

> `optional` **baseUrl?**: `string`

Defined in: [gate.ts:36](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sql/src/gate.ts#L36)

Limetry API base URL.

***

### connectionString

> **connectionString**: `string`

Defined in: [gate.ts:28](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sql/src/gate.ts#L28)

Postgres connection string; never returned to callers.

***

### dryRun?

> `optional` **dryRun?**: `boolean`

Defined in: [gate.ts:56](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sql/src/gate.ts#L56)

Default dry-run mode; defaults to `true`.

***

### fetch?

> `optional` **fetch?**: *typeof* `globalThis.fetch`

Defined in: [gate.ts:60](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sql/src/gate.ts#L60)

Optional fetch implementation for tests.

***

### policyId

> **policyId**: `string`

Defined in: [gate.ts:44](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sql/src/gate.ts#L44)

ActionPolicy id used for every SQL intent.

***

### queryRunner?

> `optional` **queryRunner?**: (`sql`) => `Promise`\<`unknown`\>

Defined in: [gate.ts:64](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sql/src/gate.ts#L64)

Optional query runner that replaces the default `pg.Client` path.

#### Parameters

##### sql

`string`

#### Returns

`Promise`\<`unknown`\>

***

### resourceLabel?

> `optional` **resourceLabel?**: `string`

Defined in: [gate.ts:52](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sql/src/gate.ts#L52)

Resource label on the ActionIntent; defaults to `postgres://*`.

***

### tenantId?

> `optional` **tenantId?**: `string`

Defined in: [gate.ts:40](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sql/src/gate.ts#L40)

Tenant id for multi-tenant evaluation.
