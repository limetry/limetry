"""
LlamaIndex-style agent tool firewall using the limetry Python SDK.

Dependency-light: no LlamaIndex install required. Wrap any FunctionTool-like
callable with `governed_tool` so evaluate runs before the tool body.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Callable

import httpx
from limetry import RemotePolicyEngine, create_slim_action_policy, redact_action_intent

POLICY_ID = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee"
AGENT_ID = "llamaindex_rag_agent"

ACTION_POLICY = create_slim_action_policy(
  agent_id=AGENT_ID,
  allowed_action_types=["retrieve", "summarize", "write_doc"],
  denied_action_types=["delete_index", "exfiltrate"],
  max_cost_minor=1000,
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


def governed_tool(
  name: str,
  fn: Callable[..., Any],
  *,
  engine: RemotePolicyEngine,
  resource: str | None = None,
) -> Callable[..., Any]:
  """Return a wrapper that evaluates `name` before invoking `fn`."""

  def wrapper(*args: Any, **kwargs: Any) -> Any:
    engine.upsert_policy(ACTION_POLICY)
    intent = {
      "intent_id": str(uuid.uuid4()),
      "policy_id": POLICY_ID,
      "agent_id": AGENT_ID,
      "action_type": name,
      "resource": resource or kwargs.get("resource") or name,
      "issued_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z",
      "metadata": {"tool": name},
    }
    _ = redact_action_intent(intent)  # type: ignore[arg-type]
    result = engine.evaluate_action(intent)  # type: ignore[arg-type]
    decision = result.get("decision") or ("allow" if result.get("approved") else "deny")
    if decision != "allow":
      reasons = result.get("reasons") or [decision]
      raise PermissionError(f"Limetry blocked {name}: {', '.join(str(r) for r in reasons)}")
    return fn(*args, **kwargs)

  wrapper.__name__ = name
  return wrapper
