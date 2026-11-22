# limetry

Python SDK for [Limetry](https://limetry.org) agent action governance. Evaluate an
action before it runs, then record a privacy-safe audit of what happened.

## Install

```bash
pip install limetry
```

Also available on conda-forge after the first PyPI release:

```bash
conda install -c conda-forge limetry
```

Requires Python 3.11 or newer.

The TypeScript equivalent is [`@limetry/sdk`](https://www.npmjs.com/package/@limetry/sdk).

## Evaluate an action

`LIMETRY_API_KEY` is a bearer token from `limetry setup` or your organization.
`LIMETRY_BASE_URL` overrides the default API origin.

```python
from limetry import create_remote_engine, create_slim_action_policy, redact_action_intent
import uuid
from datetime import datetime, timezone

policy = create_slim_action_policy(
    agent_id="checkout-agent",
    allowed_action_types=["http.request"],
    denied_action_types=["deploy"],
    max_cost_minor=100,
    audit_mode="minimal",
)

intent = {
    "intent_id": str(uuid.uuid4()),
    "policy_id": policy["policy_id"],
    "agent_id": "checkout-agent",
    "action_type": "http.request",
    "resource": "https://example.com/orders",
    "issued_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
}

engine = create_remote_engine()
result = engine.evaluate_action(intent)
print(result.get("decision"))

safe_for_logs = redact_action_intent(intent)
```

`decision` is `allow`, `deny`, or `approval_required`.

Async callers can use `create_async_remote_engine()` / `AsyncRemotePolicyEngine`.

## Privacy

Do not put API keys, passwords, or chat transcripts in action metadata. Use
`redact_details` and `project_intent_for_audit` before you store an audit record.
The default audit mode keeps a minimized projection.

## License

MIT
