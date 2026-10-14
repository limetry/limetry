[**Limetry v1.2.80**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/ci](../README.md) / EvaluateCiPrivilegeResult

# Type Alias: EvaluateCiPrivilegeResult

> **EvaluateCiPrivilegeResult** = `object`

Defined in: [evaluate.ts:72](https://github.com/limetry/limetry/blob/a4abe7149ae07b5757f2fdd4b9ab51e2090b8264/packages/ci/src/evaluate.ts#L72)

Combined trust classification, built intent, and successful evaluation result.

## Properties

### evaluation

> **evaluation**: `OkActionEvaluation`

Defined in: [evaluate.ts:84](https://github.com/limetry/limetry/blob/a4abe7149ae07b5757f2fdd4b9ab51e2090b8264/packages/ci/src/evaluate.ts#L84)

Successful remote evaluation response.

***

### intent

> **intent**: [`ActionIntent`](../../sdk/type-aliases/ActionIntent.md)

Defined in: [evaluate.ts:80](https://github.com/limetry/limetry/blob/a4abe7149ae07b5757f2fdd4b9ab51e2090b8264/packages/ci/src/evaluate.ts#L80)

ActionIntent submitted to Limetry.

***

### trust

> **trust**: [`EventTrust`](EventTrust.md)

Defined in: [evaluate.ts:76](https://github.com/limetry/limetry/blob/a4abe7149ae07b5757f2fdd4b9ab51e2090b8264/packages/ci/src/evaluate.ts#L76)

Local trust classification for the GitHub event.
