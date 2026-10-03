[**Limetry v1.2.55**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / SlimPolicyInput

# Type Alias: SlimPolicyInput

> **SlimPolicyInput** = `object`

Defined in: [policy/slim-policy.ts:14](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/policy/slim-policy.ts#L14)

Minimal input used by [createSlimPolicy](../functions/createSlimPolicy.md) to build a [SpendingPolicy](SpendingPolicy.md).

## Properties

### agentId

> **agentId**: `string`

Defined in: [policy/slim-policy.ts:18](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/policy/slim-policy.ts#L18)

Agent identity the policy governs.

***

### allowedMerchantIds?

> `optional` **allowedMerchantIds?**: `string`[]

Defined in: [policy/slim-policy.ts:46](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/policy/slim-policy.ts#L46)

Optional merchant allowlist; when non-empty, allowlist enforcement is enabled.

***

### currency?

> `optional` **currency?**: `string`

Defined in: [policy/slim-policy.ts:38](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/policy/slim-policy.ts#L38)

ISO 4217 currency code; defaults to `"USD"`.

***

### maxDailySpendMinor

> **maxDailySpendMinor**: `number`

Defined in: [policy/slim-policy.ts:30](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/policy/slim-policy.ts#L30)

Maximum aggregate daily spend (minor units).

***

### maxMonthlySpendMinor?

> `optional` **maxMonthlySpendMinor?**: `number`

Defined in: [policy/slim-policy.ts:34](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/policy/slim-policy.ts#L34)

Maximum aggregate monthly spend (minor units); defaults to `maxDailySpendMinor * 30`.

***

### maxSingleTransactionMinor

> **maxSingleTransactionMinor**: `number`

Defined in: [policy/slim-policy.ts:26](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/policy/slim-policy.ts#L26)

Maximum amount allowed for a single transaction (minor units).

***

### maxTransactionsPerMinute?

> `optional` **maxTransactionsPerMinute?**: `number`

Defined in: [policy/slim-policy.ts:42](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/policy/slim-policy.ts#L42)

Per-minute transaction cap; defaults to `10`. Hour/day caps are derived from this.

***

### organizationId?

> `optional` **organizationId?**: `string`

Defined in: [policy/slim-policy.ts:22](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/policy/slim-policy.ts#L22)

Owning organization id; defaults to `"default"`.

***

### policyId?

> `optional` **policyId?**: `string`

Defined in: [policy/slim-policy.ts:50](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/policy/slim-policy.ts#L50)

Optional stable policy id; a UUID is generated when omitted.
