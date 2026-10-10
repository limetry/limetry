# Security Policy

## Supported Versions

Limetry is released. Security fixes land on `main` and in the most recent release line.

## Reporting a Vulnerability

Please report vulnerabilities privately — do not open a public issue.

- Email: security@limetry.com
- Include reproduction steps, affected component(s), and impact assessment if possible.

We aim to acknowledge reports within 72 hours and to ship a fix or mitigation within 30 days for
confirmed high-severity issues.

## What Limetry Actually Provides

Limetry is a **policy evaluation and audit/telemetry control plane** for agent tool calls and
optional payment-domain intents. It is not a payment network, custody layer, or MPC signer.

The security boundary is explicit:

| Capability | Actual boundary |
| --- | --- |
| Policy evaluation | Authoritative for callers that invoke Limetry (`/v1/policy/evaluate`, MCP, or CLI). |
| Decision integrity | Evaluations can include HMAC receipts when `DECISION_HMAC_SECRET` is configured. |
| Audit | The server records evaluation and caller-reported action events; it cannot observe calls that bypass Limetry. |
| Agent enforcement | Not automatic. Enforce evaluation in the agent loop or with resource-side middleware. |
| Execution proof | Not provided. `POST /v1/actions/record` records what the caller reports, not independently verified execution. |
| Payment settlement | `settle` records a claimed rail receipt. With `X402_FACILITATOR_URL`, Limetry verifies with the facilitator; otherwise verification may be signature-only. |

## Scope

Reports are especially valuable for:

- HMAC decision receipt forgery or secret confusion (`DECISION_HMAC_SECRET`)
- Optional Ed25519 authorization artifact forgery (`AUTH_SIGNING_PRIVATE_KEY_HEX`, `/v1/governance/jwks`)
- HTTP replay protection on authorize/settle routes
- Policy engine bypasses (evaluation inconsistencies between native, WASM, and remote paths)
- Authentication, API-token hashing, and throttling on the governance server
- Audit log integrity and unauthorized access to `/v1/audit`

## Non-Goals and Known Limitations

Documented, intentional limitations that do not need a report:

- Limetry no longer ships FROST/MPC/threshold signing or KMS key-shard custody. Decision integrity
  uses HMAC (and optional JWT/Ed25519 for legacy payment authorize when configured).
- Production requires `USE_POSTGRES_STORE=true`. Redis is optional for nonce/throttle/JWT revocation.
- The static `LIMETRY_BEARER_TOKEN` is an operator all-scopes bypass; prefer scoped API tokens
  (hashed at rest) in multi-tenant deployments.
- Register always creates a new tenant id; it does not accept client-supplied `tenantId`.

## Cryptography (what remains)

- TLS in transit
- Password / API token hashing at rest
- HMAC-SHA256 decision receipts
- Optional short-lived JWT for user sessions
- Optional Ed25519 artifacts on the legacy payment authorize path
- Stripe webhook / facilitator verification when those rails are configured

Limetry does not invent payment cryptography and does not custody private payment keys via
threshold shares.
