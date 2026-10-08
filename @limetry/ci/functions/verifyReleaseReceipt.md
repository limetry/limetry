[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/ci](../README.md) / verifyReleaseReceipt

# Function: verifyReleaseReceipt()

> **verifyReleaseReceipt**(`input`): `boolean`

Defined in: [receipt.ts:47](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/ci/src/receipt.ts#L47)

Verify an HMAC decision receipt is bound to the expected digest (typically intent JSON hash).
Matches server `createDecisionReceipt` payload formatting.

Checks digest equality, expiry, then timing-safe HMAC comparison of:
`decision_id.decision.digest.exp.reasonsJoinedByPipe`.

## Parameters

### input

Receipt fields, expected digest, and HMAC secret.

#### expectedDigest

`string`

#### receipt

[`ReleaseReceiptFields`](../type-aliases/ReleaseReceiptFields.md)

#### secret

`string`

## Returns

`boolean`

`true` when the receipt is unexpired, digest-matched, and signature-valid.
