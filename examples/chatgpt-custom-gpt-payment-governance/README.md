# ChatGPT Custom GPT Actions

OpenAPI 3.1 schema aligned with Limetry **action governance**:

- `PUT /v1/policies/{policyId}`
- `POST /v1/policy/evaluate`
- `POST /v1/actions/record`
- `GET /v1/audit`

Legacy `POST /v1/governance/authorize` is marked deprecated for payment-rail demos only.

## Quickstart

1. Start a Limetry server (`yarn dev:server`) and create a bearer token.
2. In ChatGPT → Create a GPT → Actions → Import from file: [`openapi.json`](./openapi.json).
3. Set the server URL to your Limetry base URL and Authentication → Bearer.

## Recommended GPT instructions

- Always upsert/evaluate before irreversible tool side effects.
- On deny, surface `reasons` to the user; do not invent approval.
- Prefer evaluate/record over legacy authorize unless settling a payment rail.

## Scope

| Claim | Reality |
| --- | --- |
| Schema matches current APIs | Action governance paths |
| Runnable without GPT UI | Schema-only artifact |
| Live hosted `https://api.example.com` | Requires your deployment |
