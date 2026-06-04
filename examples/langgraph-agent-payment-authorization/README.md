# LangGraph action authorization

Deterministic LangGraph `StateGraph` that drafts an `ActionIntent`, calls
`PUT /v1/policies/:id`, `POST /v1/policy/evaluate`, and on allow
`POST /v1/actions/record`.

No LLM key and no payment-rail settlement are required.

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
2. `evaluate` — server-authoritative allow/deny + signed receipt
3. `record_allowed` or `report_rejection` — telemetry / human-readable result

## Scope

| Claim | Reality |
| --- | --- |
| LangGraph orchestration | Real `StateGraph` |
| Action governance APIs | Upsert + evaluate + record |
| Mocked CI tests | `pytest test_graph.py` |
