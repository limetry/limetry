"""
Simulated AutoGen-style SaaS broker exercising Limetry action governance.

This is a dependency-light simulation: the AutoGen SDK is not installed or
used. The broker upserts an ActionPolicy, then evaluates ActionIntents for
allow/deny (cost ceiling + resource allowlist). Replay protection for evaluate
requests is handled by the Limetry server (`intent_id` + issued_at window).
"""
import datetime
import os
import uuid

import httpx

POLICY_ID = "66666666-6666-4666-8666-666666666666"
AGENT_ID = "autogen_saas_broker"

ACTION_POLICY = {
  "policy_id": POLICY_ID,
  "version": 1,
  "organization_id": "org_autogen_demo",
  "agent_id": AGENT_ID,
  "allowed_action_types": ["renew_subscription"],
  "denied_action_types": [],
  "allowed_resource_patterns": ["merchant_slack", "merchant_openai"],
  "blocked_resource_patterns": [],
  "max_cost_minor": 10000,
  "currency": "USD",
  "status": "active",
  "updated_at": "2026-07-01T00:00:00.000Z",
}


class AutoGenSaaSPurchaser:
  """
  Simulated AutoGen agent that acts as a SaaS broker and evaluates renewals.
  """

  def __init__(
    self,
    policy_id: str = POLICY_ID,
    base_url: str = None,
    api_key: str = None,
    http_client: httpx.Client = None,
  ):
    self.policy_id = policy_id
    self.base_url = (base_url or os.getenv("LIMETRY_BASE_URL") or "http://localhost:3810").rstrip("/")
    self.api_key = api_key or os.getenv("LIMETRY_API_KEY") or "replace-with-secure-bearer-token"
    self.agent_id = AGENT_ID
    self.http_client = http_client
    self._policy_ready = False

  def _headers(self) -> dict:
    return {
      "Authorization": f"Bearer {self.api_key}",
      "Content-Type": "application/json",
    }

  def ensure_policy(self) -> None:
    if self._policy_ready:
      return
    client = self.http_client or httpx.Client()
    owns_client = self.http_client is None
    try:
      response = client.put(
        f"{self.base_url}/v1/policies/{self.policy_id}",
        json={"tenant_id": "default", "policy": {**ACTION_POLICY, "policy_id": self.policy_id}},
        headers=self._headers(),
      )
      response.raise_for_status()
      self._policy_ready = True
    finally:
      if owns_client:
        client.close()

  def submit_renewal_intent(
    self,
    merchant_id: str,
    amount_minor: int,
    idempotency_key: str,
  ) -> dict:
    """
    Builds an ActionIntent and evaluates it against the Limetry server.
    """
    self.ensure_policy()
    now = datetime.datetime.now(datetime.timezone.utc)
    intent = {
      "intent_id": str(uuid.uuid4()),
      "policy_id": self.policy_id,
      "agent_id": self.agent_id,
      "action_type": "renew_subscription",
      "resource": merchant_id,
      "cost": {
        "amount_minor": amount_minor,
        "currency": "USD",
      },
      "metadata": {
        "idempotency_key": idempotency_key,
      },
      "issued_at": now.strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z",
    }

    try:
      client = self.http_client or httpx.Client()
      owns_client = self.http_client is None
      try:
        res = client.post(
          f"{self.base_url}/v1/policy/evaluate",
          json={
            "tenant_id": "default",
            "policy_id": self.policy_id,
            "intent": intent,
          },
          headers=self._headers(),
        )
        return res.json()
      finally:
        if owns_client:
          client.close()
    except Exception as error:
      return {"ok": False, "approved": False, "error": str(error)}


def describe(result: dict) -> str:
  """
  Formats an evaluation result into a one-line summary.
  """
  if result.get("approved"):
    return "Approved"
  reasons = result.get("reasons") or []
  if reasons:
    return f"Blocked ({'; '.join(str(reason) for reason in reasons)})"
  return f"Blocked ({result.get('error') or 'denied'})"


if __name__ == "__main__":
  broker = AutoGenSaaSPurchaser()
  print(f"[*] AutoGen SaaS broker simulation against {broker.base_url}")

  fresh = broker.submit_renewal_intent(
    merchant_id="merchant_slack",
    amount_minor=2500,
    idempotency_key=f"slack-license-renewal-{uuid.uuid4()}",
  )
  print(f"[*] Slack renewal $25.00 within ceiling     -> {describe(fresh)}")

  over_budget = broker.submit_renewal_intent(
    merchant_id="merchant_slack",
    amount_minor=25000,
    idempotency_key=f"slack-license-renewal-{uuid.uuid4()}",
  )
  print(f"[*] Slack renewal $250.00 over ceiling      -> {describe(over_budget)}")

  blocked_merchant = broker.submit_renewal_intent(
    merchant_id="merchant_unknown",
    amount_minor=1000,
    idempotency_key=f"unknown-renewal-{uuid.uuid4()}",
  )
  print(f"[*] Unknown merchant renewal                -> {describe(blocked_merchant)}")
