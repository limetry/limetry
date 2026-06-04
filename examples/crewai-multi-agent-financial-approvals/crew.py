"""
Simulated crewAI-style multi-agent purchasing workflow guarded by Limetry.

This is a dependency-light simulation: the crewAI SDK is not installed or used,
and the Researcher/Auditor/Purchaser roles are plain-Python stand-ins. Policy
evaluation uses Limetry action governance over HTTP (upsert policy + evaluate).
"""
import datetime
import os
import uuid

import httpx

POLICY_ID = "99999999-9999-4999-8999-999999999999"
AGENT_ID = "crew_purchasing_agent"

ACTION_POLICY = {
  "policy_id": POLICY_ID,
  "version": 1,
  "organization_id": "org_crew",
  "agent_id": AGENT_ID,
  "allowed_action_types": ["purchase"],
  "denied_action_types": [],
  "allowed_resource_patterns": ["merchant_slack", "merchant_github"],
  "blocked_resource_patterns": ["merchant_malicious"],
  "max_cost_minor": 3000,
  "currency": "USD",
  "status": "active",
  "updated_at": "2026-07-09T19:27:40.000Z",
}


class LimetryPolicyTool:
  """
  Simulated crewAI Tool for evaluating purchases against a Limetry server.
  """

  def __init__(self, api_key: str = None, base_url: str = None, http_client: httpx.Client = None):
    self.api_key = api_key or os.getenv("LIMETRY_API_KEY") or "replace-with-secure-bearer-token"
    self.base_url = (base_url or os.getenv("LIMETRY_BASE_URL") or "http://localhost:3810").rstrip("/")
    self.http_client = http_client

  def _headers(self) -> dict:
    return {
      "Authorization": f"Bearer {self.api_key}",
      "Content-Type": "application/json",
    }

  def run(self, merchant_id: str, amount_minor: int, memo: str) -> str:
    """
    Upserts the action policy, then evaluates an ActionIntent.
    """
    now = datetime.datetime.now(datetime.timezone.utc)
    intent = {
      "intent_id": str(uuid.uuid4()),
      "policy_id": POLICY_ID,
      "agent_id": AGENT_ID,
      "action_type": "purchase",
      "resource": merchant_id,
      "cost": {
        "amount_minor": amount_minor,
        "currency": "USD",
      },
      "metadata": {
        "memo": memo,
      },
      "issued_at": now.strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z",
    }

    try:
      client = self.http_client or httpx.Client()
      owns_client = self.http_client is None
      try:
        upsert = client.put(
          f"{self.base_url}/v1/policies/{POLICY_ID}",
          json={"tenant_id": "default", "policy": ACTION_POLICY},
          headers=self._headers(),
        )
        if upsert.status_code not in (200, 201):
          return f"Rejected: policy upsert returned {upsert.status_code}"

        res = client.post(
          f"{self.base_url}/v1/policy/evaluate",
          json={
            "tenant_id": "default",
            "policy_id": POLICY_ID,
            "intent": intent,
          },
          headers=self._headers(),
        )
        if res.status_code != 200:
          return f"Rejected: Server returned {res.status_code}"

        data = res.json()
        if data.get("approved"):
          return "Approved: Intent passed policy evaluation."
        reasons = data.get("reasons") or [data.get("error") or "denied"]
        return f"Rejected: Policy violation '{'; '.join(str(reason) for reason in reasons)}'."
      finally:
        if owns_client:
          client.close()
    except Exception as error:
      return f"Rejected: Error connecting to Limetry server: {str(error)}"


def run_crew_procurement_workflow(merchant: str, cost: int, item: str, tool: LimetryPolicyTool = None):
  """
  Simulates a crewAI approval workflow containing:
  1. Researcher Agent: finds SaaS options and details cost.
  2. Auditor Agent: evaluates details and checks with the Limetry policy tool.
  """
  print(f"[*] Researcher Agent: Found subscription for {item} costing ${cost / 100:.2f} at {merchant}.")

  policy_tool = tool or LimetryPolicyTool()
  print("[*] Auditor Agent: Checking purchase plan with Limetry policy engine...")

  evaluation_result = policy_tool.run(
    merchant_id=merchant,
    amount_minor=cost,
    memo=f"Subscribe to {item}",
  )

  print(f"[*] Purchaser Agent: {evaluation_result}")
  return evaluation_result


if __name__ == "__main__":
  run_crew_procurement_workflow("merchant_slack", 1500, "Slack Pro")
  print("-" * 50)
  run_crew_procurement_workflow("merchant_malicious", 1000, "Malicious SaaS")
