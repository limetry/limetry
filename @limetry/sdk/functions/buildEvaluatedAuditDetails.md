[**Limetry v1.2.85**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / buildEvaluatedAuditDetails

# Function: buildEvaluatedAuditDetails()

> **buildEvaluatedAuditDetails**(`input`): `Record`\<`string`, `unknown`\>

Defined in: [privacy/redact.ts:308](https://github.com/limetry/limetry/blob/a92c96e29b937113a9a42b230a461a37c4719e91/packages/sdk/src/privacy/redact.ts#L308)

Builds the details blob for `policy.evaluated` audit events.

## Parameters

### input

`EvaluatedAuditDetailsInput`

Approval result, policy id, intent, and optional mode/legacy flags.

## Returns

`Record`\<`string`, `unknown`\>

JSON-serializable audit details object.
