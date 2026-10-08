[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/ci](../README.md) / runAction

# Function: runAction()

> **runAction**(`env?`): `Promise`\<`number`\>

Defined in: [run-action.ts:58](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/ci/src/run-action.ts#L58)

GitHub Action entrypoint for Limetry CI privilege / deploy gating.

Reads workflow inputs from `INPUT_*` / `LIMETRY_*` / `GITHUB_*` env vars,
evaluates via [evaluateCiPrivilege](evaluateCiPrivilege.md), and sets `decision`, `decision_id`,
`approval_id`, and `receipt_digest` outputs.

Exit codes:
- `0` — allow (or approval_required when `fail_on_approval_required` is false)
- `1` — missing inputs, untrusted event (when required), deny, or approval_required

## Parameters

### env?

`ProcessEnv` = `process.env`

Process environment; defaults to `process.env`.

## Returns

`Promise`\<`number`\>

Process exit code (`0` success, `1` failure).

## Throws

Propagates evaluation transport / remote errors to the caller.
