"""Tests for Stripe payment authorization."""
import json

import httpx

from authorize import ACTION_POLICY, authorize_payment, build_engine


def build_mock_client() -> httpx.Client:
  def handler(request: httpx.Request) -> httpx.Response:
    if request.url.path.startswith("/v1/policies/"):
      return httpx.Response(200, json={"ok": True})
    if request.url.path == "/v1/policy/evaluate":
      body = json.loads(request.content.decode("utf-8"))
      intent = body["intent"]
      if intent["action_type"] == "stripe.payout":
        return httpx.Response(200, json={
          "ok": True,
          "approved": False,
          "decision": "deny",
          "reasons": ["payout denied"],
        })
      cost = intent["cost"]["amount_minor"]
      if cost >= ACTION_POLICY.get("approval_cost_minor", 5000):
        return httpx.Response(200, json={
          "ok": True,
          "approved": False,
          "decision": "approval_required",
          "reasons": ["amount requires approval"],
        })
      return httpx.Response(200, json={
        "ok": True,
        "approved": True,
        "decision": "allow",
        "decision_id": "11111111-1111-4111-8111-111111111111",
      })
    return httpx.Response(404)

  return httpx.Client(transport=httpx.MockTransport(handler), base_url="http://limetry.test")


def test_allows_small_charge():
  engine = build_engine(api_key="t", base_url="http://limetry.test", http_client=build_mock_client())
  result = authorize_payment(
    action_type="stripe.charge",
    amount_minor=1200,
    resource="cus_123",
    engine=engine,
    execute=lambda: {"id": "ch_1"},
  )
  assert result["decision"] == "allow"
  assert result["stripe_result"]["id"] == "ch_1"


def test_blocks_payout():
  engine = build_engine(api_key="t", base_url="http://limetry.test", http_client=build_mock_client())
  result = authorize_payment(
    action_type="stripe.payout",
    amount_minor=100,
    resource="acct_1",
    engine=engine,
  )
  assert result["decision"] == "deny"
  assert "stripe_result" not in result


def test_large_charge_needs_approval():
  engine = build_engine(api_key="t", base_url="http://limetry.test", http_client=build_mock_client())
  result = authorize_payment(
    action_type="stripe.charge",
    amount_minor=7500,
    resource="cus_123",
    engine=engine,
  )
  assert result["decision"] == "approval_required"
