[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / createSlimActionPolicy

# Function: createSlimActionPolicy()

> **createSlimActionPolicy**(`input`): [`ActionPolicy`](../type-aliases/ActionPolicy.md)

Defined in: [policy/slim-policy.ts:182](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/policy/slim-policy.ts#L182)

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
