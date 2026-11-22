"""
Anthropic Claude tool_use governance via the limetry Python SDK.

Intercepts tool calls before side effects. Dependency-light: the Anthropic SDK
is not required at runtime for the governance helper; wire it into your
messages loop where you handle `tool_use` blocks.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Callable

import httpx
from limetry import RemotePolicyEngine, create_slim_action_policy, redact_action_intent

POLICY_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
AGENT_ID = "anthropic_claude_agent"

ACTION_POLICY = create_slim_action_policy(
  agent_id=AGENT_ID,
  allowed_action_types=["http_get", "search", "charge"],
  denied_action_types=["deploy", "shell"],
  max_cost_minor=2500,
  approval_cost_minor=1000,
  require_approval_action_types=["charge"],
  audit_mode="minimal",
  policy_id=POLICY_ID,
)


def build_engine(
  *,
  api_key: str | None = None,
  base_url: str | None = None,
  http_client: httpx.Client | None = None,
) -> RemotePolicyEngine:
  if api_key:
    return RemotePolicyEngine(api_key=api_key, base_url=base_url, client=http_client)
  return RemotePolicyEngine(
    api_key=api_key or "replace-with-secure-bearer-token",
    base_url=base_url or "http://localhost:3810",
    client=http_client,
  )


def tool_use_to_intent(tool_name: str, tool_input: dict[str, Any]) -> dict[str, Any]:
  """Map an Anthropic tool_use block into a Limetry ActionIntent."""
  cost_minor = int(tool_input.get("amount_minor") or tool_input.get("cost_minor") or 0)
  resource = str(tool_input.get("resource") or tool_input.get("url") or tool_name)
  intent: dict[str, Any] = {
    "intent_id": str(uuid.uuid4()),
    "policy_id": POLICY_ID,
    "agent_id": AGENT_ID,
    "action_type": tool_name,
    "resource": resource,
    "issued_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z",
    "metadata": {"tool": tool_name},
  }
  if cost_minor > 0:
    intent["cost"] = {"amount_minor": cost_minor, "currency": "USD"}
  return intent


def govern_tool_use(
  tool_name: str,
  tool_input: dict[str, Any],
  *,
  engine: RemotePolicyEngine,
  execute: Callable[[str, dict[str, Any]], Any] | None = None,
) -> dict[str, Any]:
  """
  Evaluate a tool_use block. On allow, optionally run `execute`.
  Returns decision payload plus optional execution result.
  """
  engine.upsert_policy(ACTION_POLICY)
  intent = tool_use_to_intent(tool_name, tool_input)
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
    payload["result"] = execute(tool_name, tool_input)
  return payload
