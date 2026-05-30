import pytest
import httpx
from agent import ACTION_POLICY, RemotePolicyEngine, simulate_agent_provision_request


class MockResponse:
  def __init__(self, json_data, status_code):
    self.json_data = json_data
    self.status_code = status_code
    self.text = str(json_data)

  def json(self):
    return self.json_data


@pytest.mark.asyncio
async def test_approves_t3_micro_infrastructure_deployment():
  mock_data = {
    "ok": True,
    "approved": True,
    "reasons": [],
    "decision_id": "11111111-1111-4111-8111-111111111111",
    "receipt": {"decision": "allow", "sig": "ab" * 32},
  }

  async def mock_request(method, url, **kwargs):
    return MockResponse(mock_data if method == "POST" else {"ok": True}, 200)

  async with httpx.AsyncClient() as client:
    client.request = mock_request
    client.put = lambda *args, **kwargs: mock_request("PUT", *args, **kwargs)
    client.post = lambda *args, **kwargs: mock_request("POST", *args, **kwargs)
    engine = RemotePolicyEngine(client=client)

    result = await simulate_agent_provision_request("t3.micro", "alice", engine)
    assert result["ok"] is True
    assert result["approved"] is True


@pytest.mark.asyncio
async def test_blocks_g5_4xlarge_infrastructure_deployment():
  mock_data = {
    "ok": True,
    "approved": False,
    "reasons": [
      f"cost 2000 exceeds max_cost_minor {ACTION_POLICY['max_cost_minor']}",
    ],
    "decision_id": "22222222-2222-4222-8222-222222222222",
    "receipt": {"decision": "deny", "sig": "cd" * 32},
  }

  async def mock_put(*args, **kwargs):
    return MockResponse({"ok": True}, 200)

  async def mock_post(*args, **kwargs):
    return MockResponse(mock_data, 200)

  async with httpx.AsyncClient() as client:
    client.put = mock_put
    client.post = mock_post
    engine = RemotePolicyEngine(client=client)

    result = await simulate_agent_provision_request("g5.4xlarge", "bob", engine)
    assert result["ok"] is False
    assert "exceeds max_cost_minor" in result["reasons"][0]


@pytest.mark.asyncio
async def test_handles_remote_engine_http_error():
  async def mock_put(*args, **kwargs):
    return MockResponse({"ok": True}, 200)

  async def mock_post(*args, **kwargs):
    return MockResponse("Internal Error", 500)

  async with httpx.AsyncClient() as client:
    client.put = mock_put
    client.post = mock_post
    engine = RemotePolicyEngine(client=client)

    with pytest.raises(RuntimeError) as exc_info:
      await simulate_agent_provision_request("t3.micro", "charlie", engine)
    assert "Limetry evaluation failed (500)" in str(exc_info.value)
