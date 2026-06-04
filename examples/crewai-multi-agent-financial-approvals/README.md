# crewAI-style financial approvals

Plain-Python Researcher / Auditor / Purchaser roles. The Auditor calls Limetry
(`PUT /v1/policies/:id` + `POST /v1/policy/evaluate`). The crewAI SDK is **not** installed.

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

## Scope

| Claim | Reality |
| --- | --- |
| Multi-role simulation | Yes |
| Real CrewAI SDK | No |
| Action governance HTTP | Yes — mocked in tests |
