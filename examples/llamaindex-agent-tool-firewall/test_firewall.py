"""Tests for the LlamaIndex-style tool firewall."""
import json

import httpx
import pytest

from firewall import build_engine, governed_tool


def build_mock_client() -> httpx.Client:
  def handler(request: httpx.Request) -> httpx.Response:
    if request.url.path.startswith("/v1/policies/"):
      return httpx.Response(200, json={"ok": True})
    if request.url.path == "/v1/policy/evaluate":
      body = json.loads(request.content.decode("utf-8"))
      intent = body["intent"]
      if intent["action_type"] == "delete_index":
        return httpx.Response(200, json={
          "ok": True,
          "approved": False,
          "decision": "deny",
          "reasons": ["delete_index denied"],
        })
      return httpx.Response(200, json={
        "ok": True,
        "approved": True,
        "decision": "allow",
      })
    return httpx.Response(404)

  return httpx.Client(transport=httpx.MockTransport(handler), base_url="http://limetry.test")


def test_allows_retrieve():
  engine = build_engine(api_key="t", base_url="http://limetry.test", http_client=build_mock_client())
  tool = governed_tool("retrieve", lambda q: f"hits:{q}", engine=engine)
  assert tool("agents") == "hits:agents"


def test_blocks_delete_index():
  engine = build_engine(api_key="t", base_url="http://limetry.test", http_client=build_mock_client())
  tool = governed_tool("delete_index", lambda: "gone", engine=engine)
  with pytest.raises(PermissionError, match="delete_index"):
    tool()
