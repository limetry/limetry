"""
Tests the crewAI-style LimetryPolicyTool against a mocked Limetry server.
"""
import json

import httpx

from crew import ACTION_POLICY, LimetryPolicyTool, run_crew_procurement_workflow


def build_tool() -> LimetryPolicyTool:
  def handler(request: httpx.Request) -> httpx.Response:
    if request.url.path.startswith("/v1/policies/"):
      return httpx.Response(200, json={"ok": True, "policy_id": ACTION_POLICY["policy_id"]})

    if request.url.path == "/v1/policy/evaluate":
      body = json.loads(request.content.decode("utf-8"))
      intent = body["intent"]
      resource = intent["resource"]
      cost = intent["cost"]["amount_minor"]
      if resource == "merchant_malicious":
        return httpx.Response(200, json={
          "ok": True,
          "approved": False,
          "reasons": [f"resource {resource} matches blocked pattern merchant_malicious"],
          "decision_id": "11111111-1111-4111-8111-111111111111",
        })
      if cost > ACTION_POLICY["max_cost_minor"]:
        return httpx.Response(200, json={
          "ok": True,
          "approved": False,
          "reasons": [f"cost {cost} exceeds max_cost_minor {ACTION_POLICY['max_cost_minor']}"],
          "decision_id": "22222222-2222-4222-8222-222222222222",
        })
      return httpx.Response(200, json={
        "ok": True,
        "approved": True,
        "reasons": [],
        "decision_id": "33333333-3333-4333-8333-333333333333",
      })

    return httpx.Response(404, json={"ok": False})

  transport = httpx.MockTransport(handler)
  return LimetryPolicyTool(
    base_url="http://limetry.test",
    api_key="test-token",
    http_client=httpx.Client(transport=transport),
  )


def test_approves_allowed_merchant_within_ceiling():
  tool = build_tool()
  result = run_crew_procurement_workflow("merchant_slack", 1500, "Slack Pro", tool=tool)
  assert result.startswith("Approved:")


def test_rejects_blocked_merchant():
  tool = build_tool()
  result = run_crew_procurement_workflow("merchant_malicious", 1000, "Malicious SaaS", tool=tool)
  assert "merchant_malicious" in result
  assert result.startswith("Rejected:")
