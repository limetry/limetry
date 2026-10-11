# ChatGPT Custom GPT Actions

OpenAPI 3.1 schema for connecting a Custom GPT Action to Limetry **action
governance**:

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

## Scope and boundaries

| Demonstrated | Boundary |
| --- | --- |
| Current governance paths | The schema covers policy upsert, evaluate, record, and audit |
| GPT Action integration | Import the schema in the ChatGPT builder and configure bearer auth |
| Standalone execution | Not runnable by itself; it is an OpenAPI artifact for the GPT UI |
| Payment settlement | Not implemented; the legacy authorize path is documented as deprecated |
