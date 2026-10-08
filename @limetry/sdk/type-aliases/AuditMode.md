[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / AuditMode

# Type Alias: AuditMode

> **AuditMode** = `"minimal"` \| `"forensics"`

Defined in: [privacy/redact.ts:15](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/privacy/redact.ts#L15)

Audit retention modes for ActionPolicy.
- minimal: store decision projection only (default)
- forensics: store redacted intent + details after secret scrubbing
