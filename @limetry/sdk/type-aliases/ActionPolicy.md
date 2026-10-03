[**Limetry v1.2.55**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / ActionPolicy

# Type Alias: ActionPolicy

> **ActionPolicy** = `object`

Defined in: [types.ts:256](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/types.ts#L256)

Generic action policy constraining which actions an agent may perform.

## Properties

### agent\_id

> **agent\_id**: `string`

Defined in: [types.ts:272](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/types.ts#L272)

Agent identity the policy governs.

***

### allowed\_action\_types

> **allowed\_action\_types**: `string`[]

Defined in: [types.ts:276](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/types.ts#L276)

Action types that are permitted when other rules pass.

***

### allowed\_resource\_patterns?

> `optional` **allowed\_resource\_patterns?**: `string`[]

Defined in: [types.ts:284](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/types.ts#L284)

Glob/pattern list of resources that are allowed.

***

### approval\_cost\_minor?

> `optional` **approval\_cost\_minor?**: `number`

Defined in: [types.ts:308](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/types.ts#L308)

Cost threshold (inclusive) that forces approval when intent.cost is set.

***

### audit\_mode?

> `optional` **audit\_mode?**: `"minimal"` \| `"forensics"`

Defined in: [types.ts:313](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/types.ts#L313)

How much intent content to retain in audit storage after secret scrubbing.
Defaults to minimal when omitted.

***

### blocked\_resource\_patterns?

> `optional` **blocked\_resource\_patterns?**: `string`[]

Defined in: [types.ts:288](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/types.ts#L288)

Glob/pattern list of resources that are blocked.

***

### currency?

> `optional` **currency?**: `string`

Defined in: [types.ts:296](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/types.ts#L296)

Currency expected for cost checks when set.

***

### denied\_action\_types?

> `optional` **denied\_action\_types?**: `string`[]

Defined in: [types.ts:280](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/types.ts#L280)

Action types that are always denied.

***

### effective\_from?

> `optional` **effective\_from?**: `string`

Defined in: [types.ts:325](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/types.ts#L325)

Optional start of the effective window (ISO-8601).

***

### expires\_at?

> `optional` **expires\_at?**: `string` \| `null`

Defined in: [types.ts:329](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/types.ts#L329)

Optional end of the effective window, or `null` if open-ended.

***

### max\_cost\_minor?

> `optional` **max\_cost\_minor?**: `number`

Defined in: [types.ts:292](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/types.ts#L292)

Maximum allowed `intent.cost.amount_minor` when cost is present.

***

### organization\_id

> **organization\_id**: `string`

Defined in: [types.ts:268](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/types.ts#L268)

Tenant / organization that owns the policy.

***

### policy\_id

> **policy\_id**: `string`

Defined in: [types.ts:260](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/types.ts#L260)

Stable identifier for this policy document.

***

### require\_approval\_action\_types?

> `optional` **require\_approval\_action\_types?**: `string`[]

Defined in: [types.ts:300](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/types.ts#L300)

Action types that pass allow rules but still require human approval.

***

### require\_approval\_resource\_patterns?

> `optional` **require\_approval\_resource\_patterns?**: `string`[]

Defined in: [types.ts:304](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/types.ts#L304)

Resource patterns that force approval when matched.

***

### status

> **status**: [`PolicyStatus`](PolicyStatus.md)

Defined in: [types.ts:317](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/types.ts#L317)

Current lifecycle status.

***

### updated\_at

> **updated\_at**: `string`

Defined in: [types.ts:321](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/types.ts#L321)

Last update timestamp (ISO-8601).

***

### version

> **version**: `number`

Defined in: [types.ts:264](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/types.ts#L264)

Monotonic policy revision number.
