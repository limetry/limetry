[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/ci](../README.md) / evaluateCiPrivilege

# Function: evaluateCiPrivilege()

> **evaluateCiPrivilege**(`input`): `Promise`\<[`EvaluateCiPrivilegeResult`](../type-aliases/EvaluateCiPrivilegeResult.md)\>

Defined in: [evaluate.ts:97](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/ci/src/evaluate.ts#L97)

Classify event trust and evaluate a CI privilege or deploy ActionIntent.

Builds a `repository@sha` resource, attaches `event_name` / `trust` / optional
`ref` metadata, then calls [RemotePolicyEngine.evaluateAction](../../sdk/classes/RemotePolicyEngine.md#evaluateaction).

## Parameters

### input

[`EvaluateCiPrivilegeInput`](../type-aliases/EvaluateCiPrivilegeInput.md)

API credentials, policy, repo context, and action type.

## Returns

`Promise`\<[`EvaluateCiPrivilegeResult`](../type-aliases/EvaluateCiPrivilegeResult.md)\>

Trust label, intent, and successful evaluation.

## Throws

Error When the remote evaluation returns `ok: false`.
