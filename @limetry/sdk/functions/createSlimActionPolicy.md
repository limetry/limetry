[**Limetry v1.2.55**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / createSlimActionPolicy

# Function: createSlimActionPolicy()

> **createSlimActionPolicy**(`input`): [`ActionPolicy`](../type-aliases/ActionPolicy.md)

Defined in: [policy/slim-policy.ts:182](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/policy/slim-policy.ts#L182)

Builds a generic [ActionPolicy](../type-aliases/ActionPolicy.md) from a small set of action constraints.

Sets version `1`, status `"active"`, `audit_mode` to the input or `"minimal"`,
and an open-ended effective window starting now.

## Parameters

### input

[`SlimActionPolicyInput`](../type-aliases/SlimActionPolicyInput.md)

Slim action constraints and identity fields.

## Returns

[`ActionPolicy`](../type-aliases/ActionPolicy.md)

Fully populated [ActionPolicy](../type-aliases/ActionPolicy.md) ready for persistence or evaluation.
