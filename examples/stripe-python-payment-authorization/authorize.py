"""
Authorize Stripe charges/refunds with Limetry before calling the Stripe API.

Dependency-light: Stripe SDK is optional; pass an `execute` callback that
performs the real Stripe call after allow.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Callable

import httpx
from limetry import RemotePolicyEngine, create_slim_action_policy, redact_action_intent

POLICY_ID = "ffffffff-ffff-4fff-8fff-ffffffffffff"
AGENT_ID = "stripe_payment_agent"

ACTION_POLICY = create_slim_action_policy(
  agent_id=AGENT_ID,
  allowed_action_types=["stripe.charge", "stripe.refund"],
  denied_action_types=["stripe.payout"],
  max_cost_minor=10_000,
  approval_cost_minor=5_000,
  require_approval_action_types=[],
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


def authorize_payment(
  *,
  action_type: str,
  amount_minor: int,
  resource: str,
  engine: RemotePolicyEngine,
  execute: Callable[[], Any] | None = None,
) -> dict[str, Any]:
  """Evaluate a Stripe side effect, then optionally execute it."""
  engine.upsert_policy(ACTION_POLICY)
  intent = {
    "intent_id": str(uuid.uuid4()),
    "policy_id": POLICY_ID,
    "agent_id": AGENT_ID,
    "action_type": action_type,
    "resource": resource,
    "cost": {"amount_minor": amount_minor, "currency": "USD"},
    "issued_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z",
    "metadata": {"provider": "stripe"},
  }
  safe = redact_action_intent(intent)  # type: ignore[arg-type]
  result = engine.evaluate_action(intent)  # type: ignore[arg-type]
  decision = result.get("decision") or ("allow" if result.get("approved") else "deny")
  payload: dict[str, Any] = {
    "decision": decision,
    "approved": bool(result.get("approved")),
    "reasons": result.get("reasons") or [],
    "decision_id": result.get("decision_id"),
    "intent": safe,
  }
  if decision == "allow" and execute is not None:
    payload["stripe_result"] = execute()
  return payload
