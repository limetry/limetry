[**Limetry v1.2.55**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / ActionEvaluationOutcome

# Type Alias: ActionEvaluationOutcome

> **ActionEvaluationOutcome** = `object`

Defined in: [types.ts:516](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/types.ts#L516)

Outcome summary for an action-policy evaluation.

## Properties

### approval\_id?

> `optional` **approval\_id?**: `string`

Defined in: [types.ts:544](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/types.ts#L544)

Approval workflow identifier when `decision` is `approval_required`.

***

### approved

> **approved**: `boolean`

Defined in: [types.ts:520](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/types.ts#L520)

Whether the action was approved (allow path).

***

### decision?

> `optional` **decision?**: [`ActionDecision`](ActionDecision.md)

Defined in: [types.ts:524](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/types.ts#L524)

Explicit decision enum when the server provides one.

***

### decision\_id?

> `optional` **decision\_id?**: `string`

Defined in: [types.ts:540](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/types.ts#L540)

Stable decision identifier for audit correlation.

***

### evaluated\_at

> **evaluated\_at**: `string`

Defined in: [types.ts:532](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/types.ts#L532)

Evaluation timestamp (ISO-8601).

***

### intent\_id

> **intent\_id**: `string`

Defined in: [types.ts:528](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/types.ts#L528)

Evaluated intent identifier.

***

### reasons?

> `optional` **reasons?**: `string`[]

Defined in: [types.ts:536](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/types.ts#L536)

Human-readable reasons for the decision.
