[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / buildMinimizedAuthorizationResponse

# Function: buildMinimizedAuthorizationResponse()

> **buildMinimizedAuthorizationResponse**(`input`): `Record`\<`string`, `unknown`\>

Defined in: [privacy/redact.ts:453](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/privacy/redact.ts#L453)

Builds a minimized authorization response projection for Cloud persistence.

## Parameters

### input

Decision, reasons, digests, and optional ids / receipt / expiry.

#### authorizationId?

`string`

Optional authorization row identifier.

#### decision

`"allow"` \| `"deny"`

Final authorization decision.

#### decisionId?

`string`

Optional stable decision identifier.

#### decisionReceipt?

`unknown`

Optional opaque decision receipt from the engine.

#### expiresAt?

`string` \| `null`

Optional authorization expiry (ISO-8601), or null.

#### intentDigestHex

`string`

Hex digest of the original intent.

#### reasons

`string`[]

Human-readable decision reasons.

## Returns

`Record`\<`string`, `unknown`\>

JSON-serializable authorization response projection.
