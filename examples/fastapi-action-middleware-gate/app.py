"""
FastAPI dependency that evaluates mutating routes through Limetry.

Deny returns HTTP 403 with policy reasons. Approval-required returns 202.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

import httpx
from fastapi import Depends, FastAPI, HTTPException, Request
from limetry import RemotePolicyEngine, create_slim_action_policy

POLICY_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc"
AGENT_ID = "fastapi_api_agent"

ACTION_POLICY = create_slim_action_policy(
  agent_id=AGENT_ID,
  allowed_action_types=["http_get", "http_post", "refund"],
  denied_action_types=["admin_wipe"],
  max_cost_minor=5000,
  approval_cost_minor=2000,
  audit_mode="minimal",
  policy_id=POLICY_ID,
)


def build_engine(
  *,
  api_key: str = "replace-with-secure-bearer-token",
  base_url: str = "http://localhost:3810",
  http_client: httpx.Client | None = None,
) -> RemotePolicyEngine:
  return RemotePolicyEngine(api_key=api_key, base_url=base_url, client=http_client)


def make_limetry_gate(engine: RemotePolicyEngine):
  """FastAPI dependency factory that evaluates the incoming request as an intent."""

  async def limetry_gate(request: Request) -> dict[str, Any]:
    action_type = request.headers.get("x-limetry-action-type") or request.method.lower()
    if request.method == "GET":
      action_type = "http_get"
    elif request.method == "POST":
      action_type = request.headers.get("x-limetry-action-type") or "http_post"

    cost_raw = request.headers.get("x-limetry-cost-minor")
    cost_minor = int(cost_raw) if cost_raw else 0
    intent: dict[str, Any] = {
      "intent_id": str(uuid.uuid4()),
      "policy_id": POLICY_ID,
      "agent_id": AGENT_ID,
      "action_type": action_type,
      "resource": str(request.url.path),
      "issued_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z",
    }
    if cost_minor > 0:
      intent["cost"] = {"amount_minor": cost_minor, "currency": "USD"}

    engine.upsert_policy(ACTION_POLICY)
    result = engine.evaluate_action(intent)  # type: ignore[arg-type]
    decision = result.get("decision") or ("allow" if result.get("approved") else "deny")
    reasons = result.get("reasons") or []

    if decision == "deny":
      raise HTTPException(status_code=403, detail={"decision": decision, "reasons": reasons})
    if decision == "approval_required":
      raise HTTPException(status_code=202, detail={"decision": decision, "reasons": reasons})
    return {"decision": decision, "decision_id": result.get("decision_id")}

  return limetry_gate


def create_app(engine: RemotePolicyEngine | None = None) -> FastAPI:
  resolved = engine or build_engine()
  gate = make_limetry_gate(resolved)
  app = FastAPI(title="Limetry FastAPI gate demo")

  @app.get("/health")
  def health() -> dict[str, str]:
    return {"status": "ok"}

  @app.post("/refunds")
  async def create_refund(
    _gate: dict[str, Any] = Depends(gate),
  ) -> dict[str, Any]:
    return {"ok": True, "refunded": True, "decision_id": _gate.get("decision_id")}

  @app.post("/admin/wipe")
  async def admin_wipe(
    _gate: dict[str, Any] = Depends(gate),
  ) -> dict[str, Any]:
    return {"ok": True, "wiped": True}

  return app


app = create_app()
