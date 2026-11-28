"""Tests for remote policy engine clients."""

import httpx
import pytest
import respx

from limetry import (
    AsyncRemotePolicyEngine,
    EngineLoadError,
    RemotePolicyEngine,
    create_async_remote_engine,
    create_remote_engine,
)


def _intent() -> dict:
    return {
        "intent_id": "11111111-1111-4111-8111-111111111111",
        "policy_id": "22222222-2222-4222-8222-222222222222",
        "agent_id": "demo",
        "action_type": "http_post",
        "resource": "https://example.com/charge",
        "issued_at": "2026-07-27T12:00:00.000Z",
    }


@respx.mock
def test_evaluate_action_sync() -> None:
    route = respx.post("http://localhost:3810/v1/policy/evaluate").mock(
        return_value=httpx.Response(200, json={"ok": True, "decision": "allow"}),
    )
    engine = RemotePolicyEngine(
        api_key="test-key",
        base_url="http://localhost:3810",
    )
    result = engine.evaluate_action(_intent())  # type: ignore[arg-type]
    assert result["decision"] == "allow"
    assert route.called
    engine.close()


@respx.mock
def test_evaluate_action_error() -> None:
    respx.post("http://localhost:3810/v1/policy/evaluate").mock(
        return_value=httpx.Response(500, text="boom"),
    )
    engine = RemotePolicyEngine(api_key="test-key", base_url="http://localhost:3810")
    with pytest.raises(EngineLoadError):
        engine.evaluate_action(_intent())  # type: ignore[arg-type]
    engine.close()


@respx.mock
@pytest.mark.asyncio
async def test_evaluate_action_async() -> None:
    respx.post("http://localhost:3810/v1/policy/evaluate").mock(
        return_value=httpx.Response(200, json={"ok": True, "decision": "deny"}),
    )
    engine = AsyncRemotePolicyEngine(
        api_key="test-key",
        base_url="http://localhost:3810",
    )
    result = await engine.evaluate_action(_intent())  # type: ignore[arg-type]
    assert result["decision"] == "deny"
    await engine.aclose()


def test_create_remote_engine_requires_key() -> None:
    with pytest.raises(EngineLoadError):
        create_remote_engine(env={})


def test_create_remote_engine_from_env() -> None:
    engine = create_remote_engine(
        env={"LIMETRY_API_KEY": "k", "LIMETRY_BASE_URL": "http://localhost:3810"},
    )
    assert engine.api_key == "k"
    assert engine.base_url == "http://localhost:3810"
    engine.close()


def test_create_async_remote_engine_from_env() -> None:
    engine = create_async_remote_engine(env={"LIMETRY_BEARER_TOKEN": "bearer"})
    assert engine.api_key == "bearer"
