"""
Tests the AutoGen-style SaaS broker against a mocked Limetry server.
"""
import json

import httpx

from autogen_broker import ACTION_POLICY, AutoGenSaaSPurchaser, describe


def build_broker() -> AutoGenSaaSPurchaser:
  def handler(request: httpx.Request) -> httpx.Response:
    if request.url.path.startswith("/v1/policies/"):
      return httpx.Response(200, json={"ok": True, "policy_id": ACTION_POLICY["policy_id"]})

    if request.url.path == "/v1/policy/evaluate":
      body = json.loads(request.content.decode("utf-8"))
      intent = body["intent"]
      cost = intent["cost"]["amount_minor"]
      resource = intent["resource"]
      allowed = ACTION_POLICY["allowed_resource_patterns"]
      if resource not in allowed:
        return httpx.Response(200, json={
          "ok": True,
          "approved": False,
          "reasons": [f"resource {resource} does not match any allowed_resource_patterns"],
        })
      if cost > ACTION_POLICY["max_cost_minor"]:
        return httpx.Response(200, json={
          "ok": True,
          "approved": False,
          "reasons": [f"cost {cost} exceeds max_cost_minor {ACTION_POLICY['max_cost_minor']}"],
        })
      return httpx.Response(200, json={
        "ok": True,
        "approved": True,
        "reasons": [],
        "decision_id": "44444444-4444-4444-8444-444444444444",
      })

    return httpx.Response(404, json={"ok": False})

  transport = httpx.MockTransport(handler)
  return AutoGenSaaSPurchaser(
    base_url="http://limetry.test",
    api_key="test-token",
    http_client=httpx.Client(transport=transport),
  )


def test_approves_renewal_within_ceiling():
  broker = build_broker()
  result = broker.submit_renewal_intent("merchant_slack", 2500, "key-1")
  assert describe(result) == "Approved"


def test_blocks_over_budget_renewal():
  broker = build_broker()
  result = broker.submit_renewal_intent("merchant_slack", 25000, "key-2")
  assert "exceeds max_cost_minor" in describe(result)


def test_blocks_unknown_merchant():
  broker = build_broker()
  result = broker.submit_renewal_intent("merchant_unknown", 1000, "key-3")
  assert "allowed_resource_patterns" in describe(result)
