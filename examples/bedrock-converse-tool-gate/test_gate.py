"""Tests for the Bedrock Converse tool gate."""
import json

import httpx

from gate import build_engine, extract_tool_uses, gate_tool_uses


def build_mock_client() -> httpx.Client:
  def handler(request: httpx.Request) -> httpx.Response:
    if request.url.path.startswith("/v1/policies/"):
      return httpx.Response(200, json={"ok": True})
    if request.url.path == "/v1/policy/evaluate":
      body = json.loads(request.content.decode("utf-8"))
      intent = body["intent"]
      if intent["action_type"] == "delete_bucket":
        return httpx.Response(200, json={
          "ok": True,
          "approved": False,
          "decision": "deny",
          "reasons": ["delete_bucket denied"],
        })
      return httpx.Response(200, json={
        "ok": True,
        "approved": True,
        "decision": "allow",
      })
    return httpx.Response(404)

  return httpx.Client(transport=httpx.MockTransport(handler), base_url="http://limetry.test")


SAMPLE = {
  "output": {
    "message": {
      "role": "assistant",
      "content": [
        {"toolUse": {"toolUseId": "1", "name": "lookup", "input": {"resource": "ticket/1"}}},
        {"toolUse": {"toolUseId": "2", "name": "delete_bucket", "input": {"arn": "arn:aws:s3:::x"}}},
      ],
    },
  },
}


def test_extract_tool_uses():
  assert len(extract_tool_uses(SAMPLE)) == 2


def test_gates_mixed_tools():
  engine = build_engine(api_key="t", base_url="http://limetry.test", http_client=build_mock_client())
  outcomes = gate_tool_uses(
    SAMPLE,
    engine=engine,
    execute=lambda name, inp: f"ran:{name}",
  )
  assert outcomes[0]["decision"] == "allow"
  assert outcomes[0]["result"] == "ran:lookup"
  assert outcomes[1]["decision"] == "deny"
  assert "result" not in outcomes[1]
