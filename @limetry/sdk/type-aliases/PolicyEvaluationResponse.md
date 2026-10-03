[**Limetry v1.2.55**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / PolicyEvaluationResponse

# Type Alias: PolicyEvaluationResponse

> **PolicyEvaluationResponse** = \{ `ok`: `true`; `outcome`: [`EvaluationOutcome`](EvaluationOutcome.md); `state`: [`EvaluationState`](EvaluationState.md); \} \| \{ `error?`: `string`; `ok`: `false`; `state?`: [`EvaluationState`](EvaluationState.md); `violation?`: `Record`\<`string`, `unknown`\>; \}

Defined in: [types.ts:479](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/types.ts#L479)

Discriminated response for spending-policy evaluation.

`ok: true` carries an [EvaluationOutcome](EvaluationOutcome.md); `ok: false` carries a
violation object and/or error string.

## Union Members

### Type Literal

\{ `ok`: `true`; `outcome`: [`EvaluationOutcome`](EvaluationOutcome.md); `state`: [`EvaluationState`](EvaluationState.md); \}

#### ok

> **ok**: `true`

Indicates a successful evaluation path.

#### outcome

> **outcome**: [`EvaluationOutcome`](EvaluationOutcome.md)

Approved/denied outcome details.

#### state

> **state**: [`EvaluationState`](EvaluationState.md)

Updated engine state after evaluation.

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
