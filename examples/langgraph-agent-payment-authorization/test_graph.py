"""
Tests the LangGraph action-governance graph against a mocked Limetry server.
"""
import json

import httpx

from graph import ACTION_POLICY, LimetryClient, build_graph


def build_mock_client() -> LimetryClient:
  """
  Builds a LimetryClient whose transport simulates evaluate + record.
  Costs at or below max_cost_minor are allowed; larger ones are denied.
  """

  def handler(request: httpx.Request) -> httpx.Response:
    if request.url.path.startswith("/v1/policies/"):
      return httpx.Response(200, json={"ok": True, "policy_id": ACTION_POLICY["policy_id"]})

    if request.url.path == "/v1/policy/evaluate":
      body = json.loads(request.content.decode("utf-8"))
      intent = body["intent"]
      cost = intent["cost"]["amount_minor"]
      if cost > ACTION_POLICY["max_cost_minor"]:
        return httpx.Response(200, json={
          "ok": True,
          "approved": False,
          "reasons": [
            f"cost {cost} exceeds max_cost_minor {ACTION_POLICY['max_cost_minor']}",
          ],
          "decision_id": "33333333-3333-4333-8333-333333333333",
          "receipt": {"decision": "deny", "sig": "ab" * 32},
        })
      return httpx.Response(200, json={
        "ok": True,
        "approved": True,
        "reasons": [],
        "decision_id": "22222222-2222-4222-8222-222222222222",
        "receipt": {"decision": "allow", "sig": "cd" * 32},
      })

    if request.url.path == "/v1/actions/record":
      return httpx.Response(201, json={"ok": True})

    return httpx.Response(404, json={"ok": False, "error": "not found"})

  transport = httpx.MockTransport(handler)
  return LimetryClient(
    base_url="http://limetry.test",
    api_key="test-token",
    http_client=httpx.Client(transport=transport),
  )


def test_upserts_policy_without_error():
  client = build_mock_client()
  client.upsert_policy(ACTION_POLICY)


def test_allows_intent_within_ceiling_and_records_action():
  client = build_mock_client()
  graph = build_graph(client)

  result = graph.invoke({
    "merchant_id": "merchant_vector_db",
    "merchant_name": "Vector DB Cloud",
    "amount_minor": 2000,
    "memo": "Vector database starter plan",
  })

  assert result["approved"] is True
  assert result["decision_id"] == "22222222-2222-4222-8222-222222222222"
  assert result["result"].startswith("allowed: decision 22222222-2222-4222-8222-222222222222")


def test_denies_intent_exceeding_ceiling():
  client = build_mock_client()
  graph = build_graph(client)

  result = graph.invoke({
    "merchant_id": "merchant_vector_db",
    "merchant_name": "Vector DB Cloud",
    "amount_minor": 9000,
    "memo": "Vector database enterprise plan",
  })

  assert result["approved"] is False
  assert "exceeds max_cost_minor" in result["result"]


def test_drafts_unique_intent_ids():
  client = build_mock_client()
  graph = build_graph(client)

  first = graph.invoke({
    "merchant_id": "merchant_vector_db",
    "merchant_name": "Vector DB Cloud",
    "amount_minor": 1000,
    "memo": "First purchase",
  })
  second = graph.invoke({
    "merchant_id": "merchant_vector_db",
    "merchant_name": "Vector DB Cloud",
    "amount_minor": 1000,
    "memo": "Second purchase",
  })

  assert first["intent"]["intent_id"] != second["intent"]["intent_id"]
  assert first["intent"]["action_type"] == "purchase"
