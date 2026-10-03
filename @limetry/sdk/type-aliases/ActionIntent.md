[**Limetry v1.2.55**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / ActionIntent

# Type Alias: ActionIntent

> **ActionIntent** = `object`

Defined in: [types.ts:214](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/types.ts#L214)

Generic agent action intent evaluated by [PolicyEngine.evaluateAction](PolicyEngine.md#evaluateaction).

## Properties

### action\_type

> **action\_type**: `string`

Defined in: [types.ts:230](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/types.ts#L230)

Action verb / type string (for example `http.request` or `db.query`).

***

### agent\_id

> **agent\_id**: `string`

Defined in: [types.ts:226](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/types.ts#L226)

Agent that issued the intent.

***

### cost?

> `optional` **cost?**: `object`

Defined in: [types.ts:238](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/types.ts#L238)

Optional cost associated with the action, in minor units.

#### amount\_minor

> **amount\_minor**: `number`

#### currency

> **currency**: `string`

***

### intent\_id

> **intent\_id**: `string`

Defined in: [types.ts:218](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/types.ts#L218)

Caller-supplied intent identifier (idempotency / correlation).

***

### issued\_at

> **issued\_at**: `string`

Defined in: [types.ts:246](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/types.ts#L246)

Issue timestamp (ISO-8601).

***

### metadata?

> `optional` **metadata?**: `Record`\<`string`, `string`\>

Defined in: [types.ts:242](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/types.ts#L242)

Optional string key/value bag attached to the intent.

***

### nonce?

> `optional` **nonce?**: `string` \| `number`

Defined in: [types.ts:250](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/types.ts#L250)

Optional replay nonce (string or number depending on caller).

***

### policy\_id

> **policy\_id**: `string`

Defined in: [types.ts:222](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/types.ts#L222)

Policy document to evaluate against.

***

### resource

> **resource**: `string`

Defined in: [types.ts:234](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/types.ts#L234)

Target resource identifier (URL, ARN, table, etc.).
