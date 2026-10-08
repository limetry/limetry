[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sql](../README.md) / SqlGateResult

# Type Alias: SqlGateResult

> **SqlGateResult** = `object`

Defined in: [gate.ts:70](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sql/src/gate.ts#L70)

Result of classify + evaluate + optional execute.

## Properties

### dryRun

> **dryRun**: `boolean`

Defined in: [gate.ts:86](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sql/src/gate.ts#L86)

Whether this call ran in dry-run mode.

***

### evaluation

> **evaluation**: `OkActionEvaluation`

Defined in: [gate.ts:82](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sql/src/gate.ts#L82)

Successful remote evaluation response.

***

### executed

> **executed**: `boolean`

Defined in: [gate.ts:90](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sql/src/gate.ts#L90)

`true` only when `execute` was requested, dry-run was false, and decision was `allow`.

***

### intent

> **intent**: [`ActionIntent`](../../sdk/type-aliases/ActionIntent.md)

Defined in: [gate.ts:78](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sql/src/gate.ts#L78)

ActionIntent submitted for evaluation.

***

### rows?

> `optional` **rows?**: `unknown`

Defined in: [gate.ts:94](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sql/src/gate.ts#L94)

Query result payload when `executed` is true.

***

### sqlClass

> **sqlClass**: [`SqlClass`](SqlClass.md)

Defined in: [gate.ts:74](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sql/src/gate.ts#L74)

Heuristic SQL class for the statement.
