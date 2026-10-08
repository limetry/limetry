[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / redactActionIntent

# Function: redactActionIntent()

> **redactActionIntent**(`intent`): [`ActionIntent`](../type-aliases/ActionIntent.md)

Defined in: [privacy/redact.ts:188](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/privacy/redact.ts#L188)

Returns an [ActionIntent](../type-aliases/ActionIntent.md) safe to log or forward after secret scrubbing.

Resource query strings are removed; sensitive metadata keys are redacted.

## Parameters

### intent

[`ActionIntent`](../type-aliases/ActionIntent.md)

Original action intent.

## Returns

[`ActionIntent`](../type-aliases/ActionIntent.md)

Shallow copy with scrubbed `resource` and redacted `metadata`.
