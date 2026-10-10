# AutoGen-style SaaS broker

Plain-Python AutoGen-style broker that upserts an `ActionPolicy` and evaluates subscription
renewals (`renew_subscription`) with cost ceilings and merchant allowlists.

The AutoGen SDK is **not** installed. This is an HTTP client simulation, not an
AutoGen integration. The example generates a unique `intent_id` for each
request; the current evaluate route does not deduplicate repeated requests by
that id. If execution must be exactly-once, enforce idempotency in the caller
or the downstream resource.

## Quickstart

```bash
cd examples/autogen-saas-broker-nonce-deduplication
python3 -m venv .venv
source .venv/bin/activate
pip install httpx pytest
pytest test_broker.py
python autogen_broker.py   # needs a running Limetry server
```

## Scenarios

1. Renewal within `$100` ceiling → allow
2. Renewal over ceiling → deny
3. Unknown merchant → deny (resource allowlist)

## Scope and boundaries

| Demonstrated | Boundary |
| --- | --- |
| Policy upsert and action evaluation | Real HTTP calls when a Limetry server is running |
| Cost and merchant rules | Enforced by the Limetry policy evaluator |
| AutoGen integration | Not included; roles are plain Python |
| Replay or exactly-once execution | Not provided by this example |
