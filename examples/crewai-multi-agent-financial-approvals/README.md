# crewAI-style financial approvals

Plain-Python Researcher / Auditor / Purchaser roles. The Auditor calls Limetry
(`PUT /v1/policies/{policyId}` + `POST /v1/policy/evaluate`). The crewAI SDK is
**not** installed. The workflow evaluates requests but does not purchase
anything or create a human approval task.

## Quickstart

```bash
cd examples/crewai-multi-agent-financial-approvals
python3 -m venv .venv
source .venv/bin/activate
pip install httpx pytest
pytest test_crew.py
python crew.py   # needs a running Limetry server
```

## Policy highlights

- Allow `purchase` for `merchant_slack` / `merchant_github`
- Block `merchant_malicious`
- `max_cost_minor`: $30.00

## Scope and boundaries

| Demonstrated | Boundary |
| --- | --- |
| Multi-role simulation | Plain Python role stand-ins |
| Real crewAI integration | Not included |
| Action governance HTTP | Real calls in the example; mocked in tests |
| Financial approval | Allow/deny policy decisions only; no approval inbox |
| Purchase execution | Not performed |
