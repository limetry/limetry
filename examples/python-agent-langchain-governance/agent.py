"""
LangChain-style Python agent that evaluates provision intents with Limetry.

Uses the official `limetry` Python SDK (AsyncRemotePolicyEngine). This is a
dependency-light simulation: the LangChain SDK is not installed or used.
"""
import datetime
import uuid

from limetry import AsyncRemotePolicyEngine, EngineLoadError

POLICY_ID = "22222222-2222-4222-8222-222222222222"
AGENT_ID = "agent_aws_slack"

ACTION_POLICY = {
  "policy_id": POLICY_ID,
  "version": 1,
  "organization_id": "org_demo",
  "agent_id": AGENT_ID,
  "allowed_action_types": ["provision_instance"],
  "denied_action_types": [],
  "allowed_resource_patterns": ["aws:ec2:*"],
  "blocked_resource_patterns": [],
  "max_cost_minor": 1000,
  "currency": "USD",
  "status": "active",
  "updated_at": "2026-07-09T19:27:40.000Z",
}

RESOURCE_COST_MAP = {
  "t3.micro": 10,
  "m5.large": 100,
  "g5.4xlarge": 2000,
}

# Re-export for tests that construct the engine directly.
RemotePolicyEngine = AsyncRemotePolicyEngine


async def simulate_agent_provision_request(
  resource_type: str,
  user: str,
  engine: AsyncRemotePolicyEngine,
) -> dict:
  """
  Simulates a Python AI agent building a deployment plan.
  Before spinning up cloud infrastructure, it queries Limetry.
  """
  cost_minor = RESOURCE_COST_MAP.get(resource_type)
  if cost_minor is None:
    return {"ok": False, "error": f"Unknown resource '{resource_type}'"}

  now = datetime.datetime.now(datetime.timezone.utc)
  intent = {
    "intent_id": str(uuid.uuid4()),
    "policy_id": POLICY_ID,
    "agent_id": AGENT_ID,
    "action_type": "provision_instance",
    "resource": f"aws:ec2:{resource_type}",
    "cost": {
      "amount_minor": cost_minor,
      "currency": "USD",
    },
    "metadata": {
      "requested_by": user,
    },
    "issued_at": now.strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z",
  }

  await engine.upsert_policy(ACTION_POLICY)
  try:
    result = await engine.evaluate_action(intent)  # type: ignore[arg-type]
  except EngineLoadError as error:
    raise RuntimeError(str(error)) from error
  return {
    "ok": bool(result.get("approved")),
    "approved": result.get("approved"),
    "reasons": result.get("reasons") or [],
    "decision_id": result.get("decision_id"),
    "receipt": result.get("receipt"),
    "violation": None if result.get("approved") else {"reasons": result.get("reasons")},
  }
