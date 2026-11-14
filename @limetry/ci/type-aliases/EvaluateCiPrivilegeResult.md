[**Limetry v1.2.87**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/ci](../README.md) / EvaluateCiPrivilegeResult

# Type Alias: EvaluateCiPrivilegeResult

> **EvaluateCiPrivilegeResult** = `object`

Defined in: [evaluate.ts:72](https://github.com/limetry/limetry/blob/f14000dfffe19a47b41e78212d02a5eb934e0d18/packages/ci/src/evaluate.ts#L72)

Combined trust classification, built intent, and successful evaluation result.

## Properties

### evaluation

> **evaluation**: `OkActionEvaluation`

Defined in: [evaluate.ts:84](https://github.com/limetry/limetry/blob/f14000dfffe19a47b41e78212d02a5eb934e0d18/packages/ci/src/evaluate.ts#L84)

Successful remote evaluation response.

***

### intent

> **intent**: [`ActionIntent`](../../sdk/type-aliases/ActionIntent.md)

Defined in: [evaluate.ts:80](https://github.com/limetry/limetry/blob/f14000dfffe19a47b41e78212d02a5eb934e0d18/packages/ci/src/evaluate.ts#L80)

ActionIntent submitted to Limetry.

***

### trust

> **trust**: [`EventTrust`](EventTrust.md)

Defined in: [evaluate.ts:76](https://github.com/limetry/limetry/blob/f14000dfffe19a47b41e78212d02a5eb934e0d18/packages/ci/src/evaluate.ts#L76)

Local trust classification for the GitHub event.
