# AutoGen-style SaaS broker

Plain-Python AutoGen-style broker that upserts an `ActionPolicy` and evaluates subscription
renewals (`renew_subscription`) with cost ceilings and merchant allowlists.

The AutoGen SDK is **not** installed. Replay protection for evaluate requests is handled by the
Limetry server (`intent_id` + issued_at window).

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

## Scope

| Claim | Reality |
| --- | --- |
| ActionIntent evaluate | Yes |
| AutoGen SDK | Not used |
| Nonce replay ledger | See marketplace TS example |
