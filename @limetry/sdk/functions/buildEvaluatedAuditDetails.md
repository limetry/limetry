[**Limetry v1.2.80**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / buildEvaluatedAuditDetails

# Function: buildEvaluatedAuditDetails()

> **buildEvaluatedAuditDetails**(`input`): `Record`\<`string`, `unknown`\>

Defined in: [privacy/redact.ts:308](https://github.com/limetry/limetry/blob/a4abe7149ae07b5757f2fdd4b9ab51e2090b8264/packages/sdk/src/privacy/redact.ts#L308)

Builds the details blob for `policy.evaluated` audit events.

## Parameters

### input

`EvaluatedAuditDetailsInput`

Approval result, policy id, intent, and optional mode/legacy flags.

## Returns

`Record`\<`string`, `unknown`\>

JSON-serializable audit details object.
