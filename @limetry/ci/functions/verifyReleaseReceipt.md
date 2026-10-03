[**Limetry v1.2.55**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/ci](../README.md) / verifyReleaseReceipt

# Function: verifyReleaseReceipt()

> **verifyReleaseReceipt**(`input`): `boolean`

Defined in: [receipt.ts:47](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/ci/src/receipt.ts#L47)

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
