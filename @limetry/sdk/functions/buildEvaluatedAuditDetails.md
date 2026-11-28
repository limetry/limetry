[**Limetry v1.2.106**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / buildEvaluatedAuditDetails

# Function: buildEvaluatedAuditDetails()

> **buildEvaluatedAuditDetails**(`input`): `Record`\<`string`, `unknown`\>

Defined in: [privacy/redact.ts:308](https://github.com/limetry/limetry/blob/177ce0a005d959d4fe84246d6472f9dda4bb7e04/packages/sdk/src/privacy/redact.ts#L308)

Builds the details blob for `policy.evaluated` audit events.

## Parameters

### input

`EvaluatedAuditDetailsInput`

Approval result, policy id, intent, and optional mode/legacy flags.

## Returns

`Record`\<`string`, `unknown`\>

JSON-serializable audit details object.
