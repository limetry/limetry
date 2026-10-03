[**Limetry v1.2.55**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / AuditMode

# Type Alias: AuditMode

> **AuditMode** = `"minimal"` \| `"forensics"`

Defined in: [privacy/redact.ts:15](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/privacy/redact.ts#L15)

Audit retention modes for ActionPolicy.
- minimal: store decision projection only (default)
- forensics: store redacted intent + details after secret scrubbing
