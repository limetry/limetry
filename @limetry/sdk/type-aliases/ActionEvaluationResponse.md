[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / ActionEvaluationResponse

# Type Alias: ActionEvaluationResponse

> **ActionEvaluationResponse** = \{ `approval_id?`: `string`; `approved?`: `boolean`; `decision?`: [`ActionDecision`](ActionDecision.md); `decision_id?`: `string`; `ok`: `true`; `outcome?`: [`ActionEvaluationOutcome`](ActionEvaluationOutcome.md); `reasons?`: `string`[]; `receipt?`: `Record`\<`string`, `unknown`\>; `state?`: [`EvaluationState`](EvaluationState.md); \} \| \{ `error?`: `string`; `ok`: `false`; `state?`: [`EvaluationState`](EvaluationState.md); `violation?`: `Record`\<`string`, `unknown`\>; \}

Defined in: [types.ts:553](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/types.ts#L553)

Discriminated response for action-policy evaluation.

Success payloads may include a nested `outcome`, top-level decision fields,
and an optional receipt; failure payloads mirror spending evaluation errors.

## Union Members

### Type Literal

\{ `approval_id?`: `string`; `approved?`: `boolean`; `decision?`: [`ActionDecision`](ActionDecision.md); `decision_id?`: `string`; `ok`: `true`; `outcome?`: [`ActionEvaluationOutcome`](ActionEvaluationOutcome.md); `reasons?`: `string`[]; `receipt?`: `Record`\<`string`, `unknown`\>; `state?`: [`EvaluationState`](EvaluationState.md); \}

#### approval\_id?

> `optional` **approval\_id?**: `string`

Approval workflow identifier when approval is required.

#### approved?

> `optional` **approved?**: `boolean`

Convenience approved flag mirrored from the outcome when present.

#### decision?

> `optional` **decision?**: [`ActionDecision`](ActionDecision.md)

Explicit decision enum when provided by the engine.

#### decision\_id?

> `optional` **decision\_id?**: `string`

Stable decision identifier for audit correlation.

#### ok

> **ok**: `true`

Indicates a successful evaluation path.

#### outcome?

> `optional` **outcome?**: [`ActionEvaluationOutcome`](ActionEvaluationOutcome.md)

Structured outcome summary when provided.

#### reasons?

> `optional` **reasons?**: `string`[]

Human-readable reasons for the decision.

#### receipt?

> `optional` **receipt?**: `Record`\<`string`, `unknown`\>

Opaque decision receipt returned by the server.

#### state?

> `optional` **state?**: [`EvaluationState`](EvaluationState.md)

Optional engine state after evaluation.

***

### Type Literal

\{ `error?`: `string`; `ok`: `false`; `state?`: [`EvaluationState`](EvaluationState.md); `violation?`: `Record`\<`string`, `unknown`\>; \}

#### error?

> `optional` **error?**: `string`

Human-readable error when no structured violation is present.

#### ok

> **ok**: `false`

Indicates a failed or rejected evaluation path.

#### state?

> `optional` **state?**: [`EvaluationState`](EvaluationState.md)

Optional engine state after the failed evaluation.

#### violation?

> `optional` **violation?**: `Record`\<`string`, `unknown`\>

Structured policy violation payload when available.
