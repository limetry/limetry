"""Tests for Anthropic tool_use governance against a mocked Limetry server."""
import json

import httpx

from governance import ACTION_POLICY, build_engine, govern_tool_use


def build_mock_engine() -> httpx.Client:
  def handler(request: httpx.Request) -> httpx.Response:
    if request.url.path.startswith("/v1/policies/"):
      return httpx.Response(200, json={"ok": True})
    if request.url.path == "/v1/policy/evaluate":
      body = json.loads(request.content.decode("utf-8"))
      intent = body["intent"]
      if intent["action_type"] == "shell":
        return httpx.Response(200, json={
          "ok": True,
          "approved": False,
          "decision": "deny",
          "reasons": ["action_type shell is denied"],
        })
      cost = (intent.get("cost") or {}).get("amount_minor", 0)
      if cost >= ACTION_POLICY.get("approval_cost_minor", 1000) and intent["action_type"] == "charge":
        return httpx.Response(200, json={
          "ok": True,
          "approved": False,
          "decision": "approval_required",
          "reasons": ["charge requires approval"],
        })
      return httpx.Response(200, json={
        "ok": True,
        "approved": True,
        "decision": "allow",
        "reasons": [],
        "decision_id": "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      })
    return httpx.Response(404)

  return httpx.Client(transport=httpx.MockTransport(handler), base_url="http://limetry.test")


def test_allows_search_tool():
  client = build_mock_engine()
  engine = build_engine(api_key="t", base_url="http://limetry.test", http_client=client)
  result = govern_tool_use("search", {"resource": "docs"}, engine=engine, execute=lambda n, i: "ok")
  assert result["decision"] == "allow"
  assert result["result"] == "ok"
  assert "api_key" not in (result["intent"].get("metadata") or {})


def test_denies_shell_tool():
  client = build_mock_engine()
  engine = build_engine(api_key="t", base_url="http://limetry.test", http_client=client)
  result = govern_tool_use("shell", {"resource": "rm -rf /"}, engine=engine)
  assert result["decision"] == "deny"
  assert "result" not in result


def test_charge_requires_approval():
  client = build_mock_engine()
  engine = build_engine(api_key="t", base_url="http://limetry.test", http_client=client)
  result = govern_tool_use("charge", {"amount_minor": 1500, "resource": "merchant_x"}, engine=engine)
  assert result["decision"] == "approval_required"
