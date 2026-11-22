"""HTTPS policy engine that delegates action evaluation to a Limetry server."""

from __future__ import annotations

import os
from typing import Any, Mapping

import httpx

from limetry.errors import EngineLoadError
from limetry.types import ActionEvaluationResponse, ActionIntent
from limetry.urls import resolve_limetry_base_url


class RemotePolicyEngine:
    """Synchronous remote policy engine using httpx."""

    def __init__(
        self,
        *,
        api_key: str,
        base_url: str | None = None,
        tenant_id: str = "default",
        client: httpx.Client | None = None,
        env: Mapping[str, str] | None = None,
    ) -> None:
        source = env if env is not None else os.environ
        self.base_url = resolve_limetry_base_url(source, base_url)
        self.api_key = api_key
        self.tenant_id = tenant_id
        self._client = client
        self._owns_client = client is None

    def _get_client(self) -> httpx.Client:
        if self._client is None:
            self._client = httpx.Client(timeout=30.0)
        return self._client

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    def evaluate_action(self, intent: ActionIntent) -> ActionEvaluationResponse:
        """Evaluate an ActionIntent via POST /v1/policy/evaluate."""
        url = f"{self.base_url}/v1/policy/evaluate"
        body = {
            "tenant_id": self.tenant_id,
            "policy_id": intent["policy_id"],
            "intent": intent,
        }
        response = self._get_client().post(url, json=body, headers=self._headers())
        if response.status_code >= 400:
            raise EngineLoadError(
                f"Limetry remote engine error ({response.status_code}): {response.text}",
            )
        return response.json()  # type: ignore[return-value]

    def upsert_policy(self, policy: Mapping[str, Any]) -> None:
        """Thin helper: PUT /v1/policies/{policy_id} for example bootstrap flows."""
        policy_id = policy["policy_id"]
        url = f"{self.base_url}/v1/policies/{policy_id}"
        body = {"tenant_id": self.tenant_id, "policy": policy}
        response = self._get_client().put(url, json=body, headers=self._headers())
        if response.status_code not in (200, 201):
            raise EngineLoadError(
                f"Limetry policy upsert failed ({response.status_code}): {response.text}",
            )

    def record_action(
        self,
        intent: ActionIntent,
        *,
        decision_id: str,
        outcome: str,
    ) -> None:
        """Thin helper: POST /v1/actions/record for example audit flows."""
        url = f"{self.base_url}/v1/actions/record"
        body = {
            "tenant_id": self.tenant_id,
            "intent": intent,
            "decision_id": decision_id,
            "outcome": outcome,
        }
        response = self._get_client().post(url, json=body, headers=self._headers())
        if response.status_code not in (200, 201):
            raise EngineLoadError(
                f"Limetry action record failed ({response.status_code}): {response.text}",
            )

    def close(self) -> None:
        if self._owns_client and self._client is not None:
            self._client.close()
            self._client = None

    def __enter__(self) -> RemotePolicyEngine:
        return self

    def __exit__(self, *args: object) -> None:
        self.close()


class AsyncRemotePolicyEngine:
    """Async remote policy engine using httpx.AsyncClient."""

    def __init__(
        self,
        *,
        api_key: str,
        base_url: str | None = None,
        tenant_id: str = "default",
        client: httpx.AsyncClient | None = None,
        env: Mapping[str, str] | None = None,
    ) -> None:
        source = env if env is not None else os.environ
        self.base_url = resolve_limetry_base_url(source, base_url)
        self.api_key = api_key
        self.tenant_id = tenant_id
        self._client = client
        self._owns_client = client is None

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=30.0)
        return self._client

    async def evaluate_action(self, intent: ActionIntent) -> ActionEvaluationResponse:
        """Evaluate an ActionIntent via POST /v1/policy/evaluate."""
        url = f"{self.base_url}/v1/policy/evaluate"
        body = {
            "tenant_id": self.tenant_id,
            "policy_id": intent["policy_id"],
            "intent": intent,
        }
        client = await self._get_client()
        response = await client.post(url, json=body, headers=self._headers())
        if response.status_code >= 400:
            raise EngineLoadError(
                f"Limetry remote engine error ({response.status_code}): {response.text}",
            )
        return response.json()  # type: ignore[return-value]

    async def upsert_policy(self, policy: Mapping[str, Any]) -> None:
        """Thin helper: PUT /v1/policies/{policy_id} for example bootstrap flows."""
        policy_id = policy["policy_id"]
        url = f"{self.base_url}/v1/policies/{policy_id}"
        body = {"tenant_id": self.tenant_id, "policy": policy}
        client = await self._get_client()
        response = await client.put(url, json=body, headers=self._headers())
        if response.status_code not in (200, 201):
            raise EngineLoadError(
                f"Limetry policy upsert failed ({response.status_code}): {response.text}",
            )

    async def record_action(
        self,
        intent: ActionIntent,
        *,
        decision_id: str,
        outcome: str,
    ) -> None:
        """Thin helper: POST /v1/actions/record for example audit flows."""
        url = f"{self.base_url}/v1/actions/record"
        body = {
            "tenant_id": self.tenant_id,
            "intent": intent,
            "decision_id": decision_id,
            "outcome": outcome,
        }
        client = await self._get_client()
        response = await client.post(url, json=body, headers=self._headers())
        if response.status_code not in (200, 201):
            raise EngineLoadError(
                f"Limetry action record failed ({response.status_code}): {response.text}",
            )

    async def aclose(self) -> None:
        if self._owns_client and self._client is not None:
            await self._client.aclose()
            self._client = None

    async def __aenter__(self) -> AsyncRemotePolicyEngine:
        return self

    async def __aexit__(self, *args: object) -> None:
        await self.aclose()


def _resolve_api_key(
    overrides: Mapping[str, Any] | None,
    env: Mapping[str, str],
) -> str:
    if overrides and overrides.get("api_key"):
        return str(overrides["api_key"])
    api_key = env.get("LIMETRY_API_KEY") or env.get("LIMETRY_BEARER_TOKEN")
    if not api_key:
        raise EngineLoadError(
            "No Limetry API key found. Set LIMETRY_API_KEY or run `limetry setup`.",
        )
    return api_key


def create_remote_engine(
    *,
    api_key: str | None = None,
    base_url: str | None = None,
    tenant_id: str = "default",
    client: httpx.Client | None = None,
    env: Mapping[str, str] | None = None,
) -> RemotePolicyEngine:
    """Create a sync RemotePolicyEngine from options and environment variables."""
    source = env if env is not None else os.environ
    overrides = {"api_key": api_key} if api_key else None
    resolved_key = _resolve_api_key(overrides, source)
    return RemotePolicyEngine(
        api_key=resolved_key,
        base_url=resolve_limetry_base_url(source, base_url),
        tenant_id=tenant_id,
        client=client,
        env=source,
    )


def create_async_remote_engine(
    *,
    api_key: str | None = None,
    base_url: str | None = None,
    tenant_id: str = "default",
    client: httpx.AsyncClient | None = None,
    env: Mapping[str, str] | None = None,
) -> AsyncRemotePolicyEngine:
    """Create an async AsyncRemotePolicyEngine from options and environment variables."""
    source = env if env is not None else os.environ
    overrides = {"api_key": api_key} if api_key else None
    resolved_key = _resolve_api_key(overrides, source)
    return AsyncRemotePolicyEngine(
        api_key=resolved_key,
        base_url=resolve_limetry_base_url(source, base_url),
        tenant_id=tenant_id,
        client=client,
        env=source,
    )
