# LangGraph action authorization

Deterministic LangGraph `StateGraph` that drafts an `ActionIntent`, calls
`PUT /v1/policies/{policyId}`, `POST /v1/policy/evaluate`, and on allow
`POST /v1/actions/record`.

No LLM key and no payment-rail settlement are required. “Authorization” here
means a policy decision; it does not capture funds or prove that a purchase
was executed.

## Quickstart

```bash
cd examples/langgraph-agent-payment-authorization
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pytest test_graph.py
```

Against a local server:

```bash
yarn dev:server
export LIMETRY_BASE_URL=http://localhost:3810
export LIMETRY_API_KEY=your-bearer-token
python graph.py
```

## Graph nodes

1. `draft_intent` — builds an `ActionIntent` (`action_type=purchase`, optional `cost`)
2. `evaluate` — server-authoritative allow/deny + optional signed receipt
3. `record_allowed` or `report_rejection` — telemetry / human-readable result

## Scope and boundaries

| Demonstrated | Boundary |
| --- | --- |
| LangGraph orchestration | Real deterministic `StateGraph` |
| Action governance APIs | Policy upsert, evaluate, and allowed-action record |
| Payment authorization | Policy evaluation only; no payment rail or capture |
| Execution proof | The allowed path records caller-reported telemetry |
| CI tests | `pytest test_graph.py` uses mocked HTTP |
