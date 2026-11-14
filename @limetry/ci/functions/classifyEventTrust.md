[**Limetry v1.2.87**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/ci](../README.md) / classifyEventTrust

# Function: classifyEventTrust()

> **classifyEventTrust**(`input`): [`EventTrust`](../type-aliases/EventTrust.md)

Defined in: [classify.ts:36](https://github.com/limetry/limetry/blob/f14000dfffe19a47b41e78212d02a5eb934e0d18/packages/ci/src/classify.ts#L36)

Classify whether a GitHub Actions event should receive privileged secrets.

Returns `untrusted` for known PR/issue/workflow_run events, pull refs, and
any unrecognized event name. Only `push`, `release`, and `workflow_dispatch`
are trusted.

## Parameters

### input

Event name and optional git ref from the workflow context.

#### eventName

`string`

#### ref?

`string`

## Returns

[`EventTrust`](../type-aliases/EventTrust.md)

`"trusted"` or `"untrusted"`.
