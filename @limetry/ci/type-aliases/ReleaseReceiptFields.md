[**Limetry v1.2.55**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/ci](../README.md) / ReleaseReceiptFields

# Type Alias: ReleaseReceiptFields

> **ReleaseReceiptFields** = `object`

Defined in: [receipt.ts:10](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/ci/src/receipt.ts#L10)

Fields of a Limetry decision receipt used for release verification.

## Properties

### decision

> **decision**: `string`

Defined in: [receipt.ts:14](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/ci/src/receipt.ts#L14)

Decision value (for example `allow` or `deny`).

***

### decision\_id

> **decision\_id**: `string`

Defined in: [receipt.ts:18](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/ci/src/receipt.ts#L18)

Unique decision identifier.

***

### digest

> **digest**: `string`

Defined in: [receipt.ts:22](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/ci/src/receipt.ts#L22)

Digest the receipt is bound to (typically a hash of the intent JSON).

***

### exp

> **exp**: `number`

Defined in: [receipt.ts:26](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/ci/src/receipt.ts#L26)

Unix expiry timestamp in seconds.

***

### reasons

> **reasons**: `string`[]

Defined in: [receipt.ts:30](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/ci/src/receipt.ts#L30)

Human-readable decision reasons.

***

### sig

> **sig**: `string`

Defined in: [receipt.ts:34](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/ci/src/receipt.ts#L34)

Hex-encoded HMAC-SHA256 signature over the receipt payload.
