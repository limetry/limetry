[**Limetry v1.2.106**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/ci](../README.md) / evaluateCiPrivilege

# Function: evaluateCiPrivilege()

> **evaluateCiPrivilege**(`input`): `Promise`\<[`EvaluateCiPrivilegeResult`](../type-aliases/EvaluateCiPrivilegeResult.md)\>

Defined in: [evaluate.ts:97](https://github.com/limetry/limetry/blob/177ce0a005d959d4fe84246d6472f9dda4bb7e04/packages/ci/src/evaluate.ts#L97)

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
