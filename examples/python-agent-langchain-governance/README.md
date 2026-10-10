# Python LangChain-style governance

Plain-Python simulation of a LangChain-style agent that upserts an `ActionPolicy` and evaluates
`ActionIntent`s over HTTP before a caller could provision cloud resources.

The LangChain SDK is **not** a dependency. The example uses the HTTP evaluate
contract only and makes no cloud-provider calls or resource changes.

## Quickstart

```bash
cd examples/python-agent-langchain-governance
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pytest test_agent.py
```

Against a local server:

```bash
yarn dev:server
export LIMETRY_BASE_URL=http://localhost:3810
export LIMETRY_API_KEY=your-bearer-token
```

Default base URL is `http://localhost:3810` (not the marketed cloud host).

## Flow

1. Upsert action policy (`max_cost_minor` $10.00, allow `provision_instance` on `aws:ec2:*`)
2. Evaluate intent for `t3.micro` (allow) vs `g5.4xlarge` (deny)

## Scope and boundaries

| Demonstrated | Boundary |
| --- | --- |
| HTTP evaluate contract | Policy upsert + `/v1/policy/evaluate` |
| Cost ceiling deny | Unit tests with mocked `httpx` |
| LangChain integration | Not included; this is a plain-Python simulation |
| Cloud provisioning | Not performed; no AWS or other provider SDK is called |
