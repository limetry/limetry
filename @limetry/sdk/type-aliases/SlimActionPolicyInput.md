[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / SlimActionPolicyInput

# Type Alias: SlimActionPolicyInput

> **SlimActionPolicyInput** = `object`

Defined in: [policy/slim-policy.ts:56](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/policy/slim-policy.ts#L56)

Minimal input used by [createSlimActionPolicy](../functions/createSlimActionPolicy.md) to build an [ActionPolicy](ActionPolicy.md).

## Properties

### agentId

> **agentId**: `string`

Defined in: [policy/slim-policy.ts:60](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/policy/slim-policy.ts#L60)

Agent identity the policy governs.

***

### allowedActionTypes

> **allowedActionTypes**: `string`[]

Defined in: [policy/slim-policy.ts:68](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/policy/slim-policy.ts#L68)

Action types that are permitted when other rules pass.

***

### allowedResourcePatterns?

> `optional` **allowedResourcePatterns?**: `string`[]

Defined in: [policy/slim-policy.ts:76](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/policy/slim-policy.ts#L76)

Glob/pattern list of resources that are allowed.

***

### approvalCostMinor?

> `optional` **approvalCostMinor?**: `number`

Defined in: [policy/slim-policy.ts:108](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/policy/slim-policy.ts#L108)

Inclusive cost threshold (minor units) that forces approval when cost is set.

***

### auditMode?

> `optional` **auditMode?**: `"minimal"` \| `"forensics"`

Defined in: [policy/slim-policy.ts:96](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/policy/slim-policy.ts#L96)

Audit retention mode; defaults to `"minimal"`.

***

### blockedResourcePatterns?

> `optional` **blockedResourcePatterns?**: `string`[]

Defined in: [policy/slim-policy.ts:80](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/policy/slim-policy.ts#L80)

Glob/pattern list of resources that are blocked.

***

### currency?

> `optional` **currency?**: `string`

Defined in: [policy/slim-policy.ts:88](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/policy/slim-policy.ts#L88)

Currency expected for cost checks when set.

***

### deniedActionTypes?

> `optional` **deniedActionTypes?**: `string`[]

Defined in: [policy/slim-policy.ts:72](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/policy/slim-policy.ts#L72)

Action types that are always denied.

***

### maxCostMinor?

> `optional` **maxCostMinor?**: `number`

Defined in: [policy/slim-policy.ts:84](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/policy/slim-policy.ts#L84)

Maximum allowed intent cost in minor units.

***

### organizationId?

> `optional` **organizationId?**: `string`

Defined in: [policy/slim-policy.ts:64](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/policy/slim-policy.ts#L64)

Owning organization id; defaults to `"default"`.

***

### policyId?

> `optional` **policyId?**: `string`

Defined in: [policy/slim-policy.ts:92](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/policy/slim-policy.ts#L92)

Optional stable policy id; a UUID is generated when omitted.

***

### requireApprovalActionTypes?

> `optional` **requireApprovalActionTypes?**: `string`[]

Defined in: [policy/slim-policy.ts:100](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/policy/slim-policy.ts#L100)

Action types that still require human approval after allow rules pass.

***

### requireApprovalResourcePatterns?

> `optional` **requireApprovalResourcePatterns?**: `string`[]

Defined in: [policy/slim-policy.ts:104](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/policy/slim-policy.ts#L104)

Resource patterns that force approval when matched.
