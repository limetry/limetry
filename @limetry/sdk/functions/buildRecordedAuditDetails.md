[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / buildRecordedAuditDetails

# Function: buildRecordedAuditDetails()

> **buildRecordedAuditDetails**(`input`): `Record`\<`string`, `unknown`\>

Defined in: [privacy/redact.ts:361](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/privacy/redact.ts#L361)

Builds the details blob for `action.recorded` audit events.

In `forensics` mode, includes a redacted `details` object (empty object when
absent). In `minimal` mode, omits the `details` field.

## Parameters

### input

`RecordedAuditDetailsInput`

Outcome, intent, and optional decision id / details / mode.

## Returns

`Record`\<`string`, `unknown`\>

JSON-serializable audit details object.
