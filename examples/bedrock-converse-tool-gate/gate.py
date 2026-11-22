"""
AWS Bedrock Converse tool-use gate using the limetry Python SDK.

After Converse returns toolUse blocks, evaluate each tool before execution.
Dependency-light: boto3 is optional; pass tool payloads as plain dicts.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Callable

import httpx
from limetry import RemotePolicyEngine, create_slim_action_policy, redact_action_intent

POLICY_ID = "12121212-1212-4121-8121-121212121212"
AGENT_ID = "bedrock_converse_agent"

ACTION_POLICY = create_slim_action_policy(
  agent_id=AGENT_ID,
  allowed_action_types=["lookup", "create_ticket", "invoke_lambda"],
  denied_action_types=["delete_bucket", "iam_attach"],
  max_cost_minor=2000,
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


def extract_tool_uses(converse_response: dict[str, Any]) -> list[dict[str, Any]]:
  """Pull toolUse blocks from a Bedrock Converse-style response dict."""
  output = converse_response.get("output") or {}
  message = output.get("message") or converse_response.get("message") or {}
  content = message.get("content") or []
  tools: list[dict[str, Any]] = []
  for block in content:
    tool_use = block.get("toolUse") if isinstance(block, dict) else None
    if tool_use:
      tools.append(tool_use)
  return tools


def gate_tool_uses(
  converse_response: dict[str, Any],
  *,
  engine: RemotePolicyEngine,
  execute: Callable[[str, dict[str, Any]], Any] | None = None,
) -> list[dict[str, Any]]:
  """
  Evaluate each toolUse from a Converse response. On allow, optionally execute.
  """
  engine.upsert_policy(ACTION_POLICY)
  outcomes: list[dict[str, Any]] = []
  for tool_use in extract_tool_uses(converse_response):
    name = str(tool_use.get("name") or "unknown")
    tool_input = tool_use.get("input") or {}
    resource = str(tool_input.get("resource") or tool_input.get("arn") or name)
    intent = {
      "intent_id": str(uuid.uuid4()),
      "policy_id": POLICY_ID,
      "agent_id": AGENT_ID,
      "action_type": name,
      "resource": resource,
      "issued_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z",
      "metadata": {"toolUseId": str(tool_use.get("toolUseId") or "")},
    }
    safe = redact_action_intent(intent)  # type: ignore[arg-type]
    result = engine.evaluate_action(intent)  # type: ignore[arg-type]
    decision = result.get("decision") or ("allow" if result.get("approved") else "deny")
    item: dict[str, Any] = {
      "name": name,
      "decision": decision,
      "reasons": result.get("reasons") or [],
      "intent": safe,
    }
    if decision == "allow" and execute is not None:
      item["result"] = execute(name, tool_input if isinstance(tool_input, dict) else {})
    outcomes.append(item)
  return outcomes
