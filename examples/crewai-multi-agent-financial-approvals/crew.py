"""
Simulated crewAI-style multi-agent purchasing workflow guarded by Limetry.

This is a dependency-light simulation: the crewAI SDK is not installed or used,
and the Researcher/Auditor/Purchaser roles are plain-Python stand-ins. Policy
evaluation uses the official `limetry` Python SDK.
"""
import datetime
import os
import uuid

import httpx
from limetry import RemotePolicyEngine

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

  def __init__(
    self,
    api_key: str = None,
    base_url: str = None,
    http_client: httpx.Client = None,
  ):
    resolved_key = api_key or os.getenv("LIMETRY_API_KEY") or "replace-with-secure-bearer-token"
    resolved_base = (base_url or os.getenv("LIMETRY_BASE_URL") or "http://localhost:3810").rstrip("/")
    self.engine = RemotePolicyEngine(
      api_key=resolved_key,
      base_url=resolved_base,
      client=http_client,
    )
    self.api_key = resolved_key
    self.base_url = self.engine.base_url
    self.http_client = http_client

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
      self.engine.upsert_policy(ACTION_POLICY)
      data = self.engine.evaluate_action(intent)  # type: ignore[arg-type]
      if data.get("approved"):
        return "Approved: Intent passed policy evaluation."
      reasons = data.get("reasons") or [data.get("error") or "denied"]
      return f"Rejected: Policy violation '{'; '.join(str(reason) for reason in reasons)}'."
    except Exception as error:
      return f"Rejected: {error}"


def run_crew_procurement_workflow(
  merchant_id: str,
  amount_minor: int,
  memo: str,
  tool: LimetryPolicyTool = None,
) -> str:
  """
  Runs Researcher -> Auditor -> Purchaser simulation ending in a Limetry check.
  """
  policy_tool = tool or LimetryPolicyTool()
  return policy_tool.run(merchant_id, amount_minor, memo)


if __name__ == "__main__":
  print("[*] CrewAI-style procurement simulation")
  print(run_crew_procurement_workflow("merchant_slack", 1500, "Slack Pro"))
  print(run_crew_procurement_workflow("merchant_malicious", 1000, "Malicious SaaS"))
