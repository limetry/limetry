[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / SpendingPolicy

# Type Alias: SpendingPolicy

> **SpendingPolicy** = `object`

Defined in: [types.ts:160](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/types.ts#L160)

Full spending policy document evaluated for payment [TransactionIntent](TransactionIntent.md)s.

## Properties

### agent\_id

> **agent\_id**: `string`

Defined in: [types.ts:176](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/types.ts#L176)

Agent identity the policy governs.

***

### destination\_rules

> **destination\_rules**: [`DestinationRules`](DestinationRules.md)

Defined in: [types.ts:196](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/types.ts#L196)

Destination allow/block rules.

***

### effective\_window

> **effective\_window**: [`EffectiveWindow`](EffectiveWindow.md)

Defined in: [types.ts:200](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/types.ts#L200)

Time window during which the policy is active.

***

### isolation

> **isolation**: [`IsolationBounds`](IsolationBounds.md)

Defined in: [types.ts:192](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/types.ts#L192)

Pending-intent isolation bounds.

***

### limits

> **limits**: [`SpendingLimits`](SpendingLimits.md)

Defined in: [types.ts:180](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/types.ts#L180)

Per-transaction and aggregate spend caps.

***

### organization\_id

> **organization\_id**: `string`

Defined in: [types.ts:172](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/types.ts#L172)

Tenant / organization that owns the policy.

***

### policy\_id

> **policy\_id**: `string`

Defined in: [types.ts:164](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/types.ts#L164)

Stable identifier for this policy document.

***

### replay

> **replay**: [`ReplayProtectionConfig`](ReplayProtectionConfig.md)

Defined in: [types.ts:188](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/types.ts#L188)

Replay-protection settings.

***

### status

> **status**: [`PolicyStatus`](PolicyStatus.md)

Defined in: [types.ts:204](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/types.ts#L204)

Current lifecycle status.

***

### updated\_at

> **updated\_at**: `string`

Defined in: [types.ts:208](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/types.ts#L208)

Last update timestamp (ISO-8601).

***

### velocity

> **velocity**: [`VelocityLimits`](VelocityLimits.md)

Defined in: [types.ts:184](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/types.ts#L184)

Velocity / rate limits.

***

### version

> **version**: `number`

Defined in: [types.ts:168](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/types.ts#L168)

Monotonic policy revision number.
