[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/ci](../README.md) / EvaluateCiPrivilegeInput

# Type Alias: EvaluateCiPrivilegeInput

> **EvaluateCiPrivilegeInput** = `object`

Defined in: [evaluate.ts:22](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/ci/src/evaluate.ts#L22)

Inputs for [evaluateCiPrivilege](../functions/evaluateCiPrivilege.md).

## Properties

### actionType

> **actionType**: `"ci_privilege"` \| `"deploy"`

Defined in: [evaluate.ts:46](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/ci/src/evaluate.ts#L46)

Whether this is a CI privilege check or a deploy gate.

***

### agentId

> **agentId**: `string`

Defined in: [evaluate.ts:42](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/ci/src/evaluate.ts#L42)

Agent id recorded on the ActionIntent.

***

### apiKey

> **apiKey**: `string`

Defined in: [evaluate.ts:30](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/ci/src/evaluate.ts#L30)

Limetry API key / bearer token.

***

### baseUrl?

> `optional` **baseUrl?**: `string`

Defined in: [evaluate.ts:26](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/ci/src/evaluate.ts#L26)

Limetry API base URL; passed through to [RemotePolicyEngine](../../sdk/classes/RemotePolicyEngine.md).

***

### eventName

> **eventName**: `string`

Defined in: [evaluate.ts:58](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/ci/src/evaluate.ts#L58)

GitHub Actions event name used for trust classification.

***

### fetch?

> `optional` **fetch?**: *typeof* `globalThis.fetch`

Defined in: [evaluate.ts:66](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/ci/src/evaluate.ts#L66)

Optional fetch implementation for tests.

***

### policyId

> **policyId**: `string`

Defined in: [evaluate.ts:38](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/ci/src/evaluate.ts#L38)

ActionPolicy id to evaluate against.

***

### ref?

> `optional` **ref?**: `string`

Defined in: [evaluate.ts:62](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/ci/src/evaluate.ts#L62)

Optional git ref; pull refs force untrusted classification.

***

### repository

> **repository**: `string`

Defined in: [evaluate.ts:50](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/ci/src/evaluate.ts#L50)

GitHub repository (`owner/repo`).

***

### sha

> **sha**: `string`

Defined in: [evaluate.ts:54](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/ci/src/evaluate.ts#L54)

Commit SHA being gated.

***

### tenantId?

> `optional` **tenantId?**: `string`

Defined in: [evaluate.ts:34](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/ci/src/evaluate.ts#L34)

Tenant id for multi-tenant evaluation.
