[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / buildEvaluatedAuditDetails

# Function: buildEvaluatedAuditDetails()

> **buildEvaluatedAuditDetails**(`input`): `Record`\<`string`, `unknown`\>

Defined in: [privacy/redact.ts:308](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/privacy/redact.ts#L308)

Builds the details blob for `policy.evaluated` audit events.

## Parameters

### input

`EvaluatedAuditDetailsInput`

Approval result, policy id, intent, and optional mode/legacy flags.

## Returns

`Record`\<`string`, `unknown`\>

JSON-serializable audit details object.
