import datetime
import os
import uuid

import httpx

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


class RemotePolicyEngine:
  """
  Python client for Limetry action governance over HTTP.
  Upserts an ActionPolicy, then evaluates ActionIntents.
  """

  def __init__(self, api_key: str = None, base_url: str = None, client: httpx.AsyncClient = None):
    self.api_key = api_key or os.getenv("LIMETRY_API_KEY") or "mock-bearer-token"
    self.base_url = (base_url or os.getenv("LIMETRY_BASE_URL") or "http://localhost:3810").rstrip("/")
    self.client = client or httpx.AsyncClient()

  def _headers(self) -> dict:
    return {
      "Authorization": f"Bearer {self.api_key}",
      "Content-Type": "application/json",
    }

  async def upsert_policy(self, policy: dict) -> None:
    response = await self.client.put(
      f"{self.base_url}/v1/policies/{policy['policy_id']}",
      json={"tenant_id": "default", "policy": policy},
      headers=self._headers(),
    )
    if response.status_code not in (200, 201):
      raise RuntimeError(f"Limetry policy upsert failed ({response.status_code}): {response.text}")

  async def evaluate_policy(self, intent: dict) -> dict:
    url = f"{self.base_url}/v1/policy/evaluate"
    payload = {
      "tenant_id": "default",
      "policy_id": intent["policy_id"],
      "intent": intent,
    }

    response = await self.client.post(url, json=payload, headers=self._headers())
    if response.status_code != 200:
      raise RuntimeError(f"Limetry evaluation failed ({response.status_code}): {response.text}")

    return response.json()


async def simulate_agent_provision_request(
  resource_type: str,
  user: str,
  engine: RemotePolicyEngine,
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
  result = await engine.evaluate_policy(intent)
  return {
    "ok": bool(result.get("approved")),
    "approved": result.get("approved"),
    "reasons": result.get("reasons") or [],
    "decision_id": result.get("decision_id"),
    "receipt": result.get("receipt"),
    "violation": None if result.get("approved") else {"reasons": result.get("reasons")},
  }
