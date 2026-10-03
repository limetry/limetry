[**Limetry v1.2.55**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / createSlimPolicy

# Function: createSlimPolicy()

> **createSlimPolicy**(`input`): [`SpendingPolicy`](../type-aliases/SpendingPolicy.md)

Defined in: [policy/slim-policy.ts:121](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/policy/slim-policy.ts#L121)

Builds a full [SpendingPolicy](../type-aliases/SpendingPolicy.md) from a small set of limits.

Prefer this for CLI/MCP first-run instead of hand-rolled JSON. Sets version
`1`, status `"active"`, sensible replay/isolation defaults, and derives
velocity and monthly caps when those inputs are omitted.

## Parameters

### input

[`SlimPolicyInput`](../type-aliases/SlimPolicyInput.md)

Slim spending limits and identity fields.

## Returns

[`SpendingPolicy`](../type-aliases/SpendingPolicy.md)

Fully populated [SpendingPolicy](../type-aliases/SpendingPolicy.md) ready for persistence or evaluation.
