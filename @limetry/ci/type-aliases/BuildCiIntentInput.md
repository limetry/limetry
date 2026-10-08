[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/ci](../README.md) / BuildCiIntentInput

# Type Alias: BuildCiIntentInput

> **BuildCiIntentInput** = `object`

Defined in: [intent.ts:12](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/ci/src/intent.ts#L12)

Inputs for [buildCiIntent](../functions/buildCiIntent.md).

## Properties

### actionType

> **actionType**: `"ci_privilege"` \| `"deploy"`

Defined in: [intent.ts:24](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/ci/src/intent.ts#L24)

CI action type to evaluate.

***

### agentId

> **agentId**: `string`

Defined in: [intent.ts:20](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/ci/src/intent.ts#L20)

Agent identity bound to the intent (for example `github_actions`).

***

### issuedAt?

> `optional` **issuedAt?**: `string`

Defined in: [intent.ts:32](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/ci/src/intent.ts#L32)

ISO-8601 issuance timestamp; defaults to now.

***

### metadata?

> `optional` **metadata?**: `Record`\<`string`, `string`\>

Defined in: [intent.ts:36](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/ci/src/intent.ts#L36)

String metadata attached to the intent (event name, trust, ref, etc.).

***

### policyId

> **policyId**: `string`

Defined in: [intent.ts:16](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/ci/src/intent.ts#L16)

Registered ActionPolicy id.

***

### resource

> **resource**: `string`

Defined in: [intent.ts:28](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/ci/src/intent.ts#L28)

Resource string, typically `repository@sha` from [buildRepoShaResource](../functions/buildRepoShaResource.md).
