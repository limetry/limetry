[**Limetry v1.2.85**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / createSlimActionPolicy

# Function: createSlimActionPolicy()

> **createSlimActionPolicy**(`input`): [`ActionPolicy`](../type-aliases/ActionPolicy.md)

Defined in: [policy/slim-policy.ts:182](https://github.com/limetry/limetry/blob/a92c96e29b937113a9a42b230a461a37c4719e91/packages/sdk/src/policy/slim-policy.ts#L182)

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
