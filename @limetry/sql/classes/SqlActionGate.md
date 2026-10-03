[**Limetry v1.2.55**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sql](../README.md) / SqlActionGate

# Class: SqlActionGate

Defined in: [gate.ts:103](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sql/src/gate.ts#L103)

Owns Postgres credentials and evaluates SQL intents before optional execute.

Execution requires `execute: true`, `dryRun: false`, and `decision === "allow"`.
`approval_required` decisions are tracked via [SqlActionGate.listPending](#listpending).

## Constructors

### Constructor

> **new SqlActionGate**(`options`): `SqlActionGate`

Defined in: [gate.ts:121](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sql/src/gate.ts#L121)

#### Parameters

##### options

[`SqlGateOptions`](../type-aliases/SqlGateOptions.md)

DB connection, Limetry API settings, and dry-run default.

#### Returns

`SqlActionGate`

## Properties

### agentId

> `private` `readonly` **agentId**: `string`

Defined in: [gate.ts:107](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sql/src/gate.ts#L107)

***

### connectionString

> `private` `readonly` **connectionString**: `string`

Defined in: [gate.ts:104](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sql/src/gate.ts#L104)

***

### dryRunDefault

> `private` `readonly` **dryRunDefault**: `boolean`

Defined in: [gate.ts:109](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sql/src/gate.ts#L109)

***

### engine

> `private` `readonly` **engine**: [`RemotePolicyEngine`](../../sdk/classes/RemotePolicyEngine.md)

Defined in: [gate.ts:105](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sql/src/gate.ts#L105)

***

### pendingApprovals

> `private` `readonly` **pendingApprovals**: `object`[] = `[]`

Defined in: [gate.ts:111](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sql/src/gate.ts#L111)

#### approval\_id

> **approval\_id**: `string`

#### decision\_id

> **decision\_id**: `string`

#### sql

> **sql**: `string`

#### sqlClass

> **sqlClass**: [`SqlClass`](../type-aliases/SqlClass.md)

***

### policyId

> `private` `readonly` **policyId**: `string`

Defined in: [gate.ts:106](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sql/src/gate.ts#L106)

***

### queryRunner?

> `private` `readonly` `optional` **queryRunner?**: (`sql`) => `Promise`\<`unknown`\>

Defined in: [gate.ts:110](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sql/src/gate.ts#L110)

#### Parameters

##### sql

`string`

#### Returns

`Promise`\<`unknown`\>

***

### resourceLabel

> `private` `readonly` **resourceLabel**: `string`

Defined in: [gate.ts:108](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sql/src/gate.ts#L108)

## Methods

### evaluateAndMaybeExecute()

> **evaluateAndMaybeExecute**(`input`): `Promise`\<[`SqlGateResult`](../type-aliases/SqlGateResult.md)\>

Defined in: [gate.ts:159](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sql/src/gate.ts#L159)

Classify, evaluate, and optionally execute a SQL statement.

Metadata includes `sql_class`, a 200-character `sql_preview`, and `dry_run`.

#### Parameters

##### input

SQL text plus optional dry-run / execute overrides.

###### dryRun?

`boolean`

###### execute?

`boolean`

###### sql

`string`

#### Returns

`Promise`\<[`SqlGateResult`](../type-aliases/SqlGateResult.md)\>

Classification, evaluation, and optional row payload.

#### Throws

Error When Limetry evaluation returns `ok: false`.

***

### listPending()

> **listPending**(): `object`[]

Defined in: [gate.ts:141](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sql/src/gate.ts#L141)

Return a copy of in-process statements that received `approval_required`.

#### Returns

`object`[]

Pending approval entries with sql class and full SQL text.

***

### runQuery()

> `private` **runQuery**(`sql`): `Promise`\<`unknown`\>

Defined in: [gate.ts:225](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sql/src/gate.ts#L225)

Execute SQL via the injected query runner or a short-lived `pg.Client`.

#### Parameters

##### sql

`string`

Statement to run.

#### Returns

`Promise`\<`unknown`\>

Query runner result, or `{ rowCount, rows, fields }` from `pg`.
