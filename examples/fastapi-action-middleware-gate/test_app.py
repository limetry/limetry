"""Tests for the FastAPI Limetry gate."""
import json

import httpx
from fastapi.testclient import TestClient

from app import ACTION_POLICY, build_engine, create_app


def build_mock_client() -> httpx.Client:
  def handler(request: httpx.Request) -> httpx.Response:
    if request.url.path.startswith("/v1/policies/"):
      return httpx.Response(200, json={"ok": True})
    if request.url.path == "/v1/policy/evaluate":
      body = json.loads(request.content.decode("utf-8"))
      intent = body["intent"]
      if intent["action_type"] == "admin_wipe" or intent["resource"] == "/admin/wipe":
        return httpx.Response(200, json={
          "ok": True,
          "approved": False,
          "decision": "deny",
          "reasons": ["admin_wipe denied"],
        })
      cost = (intent.get("cost") or {}).get("amount_minor", 0)
      if cost >= ACTION_POLICY.get("approval_cost_minor", 2000):
        return httpx.Response(200, json={
          "ok": True,
          "approved": False,
          "decision": "approval_required",
          "reasons": ["cost requires approval"],
        })
      return httpx.Response(200, json={
        "ok": True,
        "approved": True,
        "decision": "allow",
        "decision_id": "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
      })
    return httpx.Response(404)

  return httpx.Client(transport=httpx.MockTransport(handler), base_url="http://limetry.test")


def test_allows_small_refund():
  engine = build_engine(api_key="t", base_url="http://limetry.test", http_client=build_mock_client())
  client = TestClient(create_app(engine))
  response = client.post("/refunds", headers={"x-limetry-action-type": "refund", "x-limetry-cost-minor": "500"})
  assert response.status_code == 200
  assert response.json()["refunded"] is True


def test_denies_admin_wipe():
  engine = build_engine(api_key="t", base_url="http://limetry.test", http_client=build_mock_client())
  client = TestClient(create_app(engine))
  response = client.post("/admin/wipe", headers={"x-limetry-action-type": "admin_wipe"})
  assert response.status_code == 403


def test_approval_required_for_large_refund():
  engine = build_engine(api_key="t", base_url="http://limetry.test", http_client=build_mock_client())
  client = TestClient(create_app(engine))
  response = client.post("/refunds", headers={"x-limetry-action-type": "refund", "x-limetry-cost-minor": "2500"})
  assert response.status_code == 202
