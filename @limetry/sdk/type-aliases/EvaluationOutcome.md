[**Limetry v1.2.87**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / EvaluationOutcome

# Type Alias: EvaluationOutcome

> **EvaluationOutcome** = `object`

Defined in: [types.ts:450](https://github.com/limetry/limetry/blob/f14000dfffe19a47b41e78212d02a5eb934e0d18/packages/sdk/src/types.ts#L450)

Successful spending-policy evaluation outcome summary.

## Properties

### approved

> **approved**: `boolean`

Defined in: [types.ts:454](https://github.com/limetry/limetry/blob/f14000dfffe19a47b41e78212d02a5eb934e0d18/packages/sdk/src/types.ts#L454)

Whether the intent was approved.

***

### evaluated\_at

> **evaluated\_at**: `string`

Defined in: [types.ts:462](https://github.com/limetry/limetry/blob/f14000dfffe19a47b41e78212d02a5eb934e0d18/packages/sdk/src/types.ts#L462)

Evaluation timestamp (ISO-8601).

***

### intent\_id

> **intent\_id**: `string`

Defined in: [types.ts:458](https://github.com/limetry/limetry/blob/f14000dfffe19a47b41e78212d02a5eb934e0d18/packages/sdk/src/types.ts#L458)

Evaluated intent identifier.

***

### remaining\_daily\_spend\_minor

> **remaining\_daily\_spend\_minor**: `number`

Defined in: [types.ts:466](https://github.com/limetry/limetry/blob/f14000dfffe19a47b41e78212d02a5eb934e0d18/packages/sdk/src/types.ts#L466)

Remaining daily spend capacity in minor units after this decision.

***

### remaining\_single\_transaction\_minor

> **remaining\_single\_transaction\_minor**: `number`

Defined in: [types.ts:470](https://github.com/limetry/limetry/blob/f14000dfffe19a47b41e78212d02a5eb934e0d18/packages/sdk/src/types.ts#L470)

Remaining single-transaction capacity in minor units after this decision.
