"""
LangGraph agent that evaluates sensitive actions through Limetry.

Uses the real LangGraph SDK (StateGraph) and the official `limetry` Python SDK.
Nodes draft an ActionIntent, call evaluate, optionally record, and branch on
allow/deny. No payment rail settlement runs in this example.
"""
import datetime
import os
import uuid
from typing import Any, Optional, TypedDict

import httpx
from langgraph.graph import END, START, StateGraph
from limetry import RemotePolicyEngine

POLICY_ID = "77777777-7777-4777-8777-777777777777"
AGENT_ID = "langgraph_procurement_agent"
TENANT_ID = "default"

ACTION_POLICY = {
  "policy_id": POLICY_ID,
  "version": 1,
  "organization_id": "org_langgraph_demo",
  "agent_id": AGENT_ID,
  "allowed_action_types": ["purchase"],
  "denied_action_types": [],
  "allowed_resource_patterns": ["merchant_vector_db", "merchant_slack"],
  "blocked_resource_patterns": [],
  "max_cost_minor": 5000,
  "currency": "USD",
  "status": "active",
  "updated_at": "2026-07-01T00:00:00.000Z",
}


class LimetryClient:
  """
  Thin wrapper around limetry.RemotePolicyEngine for graph nodes.
  """

  def __init__(
    self,
    base_url: str = None,
    api_key: str = None,
    http_client: httpx.Client = None,
  ):
    resolved_base = (base_url or os.getenv("LIMETRY_BASE_URL") or "http://localhost:3810").rstrip("/")
    resolved_key = api_key or os.getenv("LIMETRY_API_KEY") or "replace-with-secure-bearer-token"
    self.engine = RemotePolicyEngine(
      api_key=resolved_key,
      base_url=resolved_base,
      tenant_id=TENANT_ID,
      client=http_client,
    )
    self.base_url = self.engine.base_url
    self.api_key = resolved_key

  def upsert_policy(self, policy: dict) -> None:
    self.engine.upsert_policy(policy)

  def evaluate_intent(self, intent: dict) -> dict:
    return self.engine.evaluate_action(intent)  # type: ignore[arg-type]

  def record_action(self, intent: dict, decision_id: str, outcome: str) -> None:
    self.engine.record_action(
      intent,  # type: ignore[arg-type]
      decision_id=decision_id,
      outcome=outcome,
    )


class ActionState(TypedDict, total=False):
  """
  Shared LangGraph state flowing between nodes.
  """
  merchant_id: str
  merchant_name: str
  amount_minor: int
  memo: str
  intent: dict
  decision_id: Optional[str]
  approved: Optional[bool]
  reasons: Optional[Any]
  result: str


def build_graph(client: LimetryClient):
  """
  Wires the LangGraph StateGraph: draft -> evaluate -> record or reject.
  """

  def draft_intent(state: ActionState) -> ActionState:
    now = datetime.datetime.now(datetime.timezone.utc)
    intent = {
      "intent_id": str(uuid.uuid4()),
      "policy_id": POLICY_ID,
      "agent_id": AGENT_ID,
      "action_type": "purchase",
      "resource": state["merchant_id"],
      "cost": {
        "amount_minor": state["amount_minor"],
        "currency": "USD",
      },
      "metadata": {
        "merchant_name": state["merchant_name"],
        "memo": state["memo"],
      },
      "issued_at": now.strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z",
    }
    return {"intent": intent}

  def evaluate(state: ActionState) -> ActionState:
    outcome = client.evaluate_intent(state["intent"])
    approved = bool(outcome.get("approved"))
    return {
      "approved": approved,
      "decision_id": outcome.get("decision_id"),
      "reasons": outcome.get("reasons") or [],
    }

  def record_allowed(state: ActionState) -> ActionState:
    decision_id = state.get("decision_id") or str(uuid.uuid4())
    client.record_action(state["intent"], decision_id, "executed")
    return {
      "result": (
        f"allowed: decision {decision_id} recorded for "
        f"{state['intent']['action_type']} on {state['intent']['resource']}"
      ),
    }

  def report_rejection(state: ActionState) -> ActionState:
    reasons = state.get("reasons") or ["denied"]
    return {"result": f"denied: {', '.join(str(reason) for reason in reasons)}"}

  def route_after_evaluate(state: ActionState) -> str:
    return "allowed" if state.get("approved") else "denied"

  builder = StateGraph(ActionState)
  builder.add_node("draft_intent", draft_intent)
  builder.add_node("evaluate", evaluate)
  builder.add_node("record_allowed", record_allowed)
  builder.add_node("report_rejection", report_rejection)

  builder.add_edge(START, "draft_intent")
  builder.add_edge("draft_intent", "evaluate")
  builder.add_conditional_edges(
    "evaluate",
    route_after_evaluate,
    {"allowed": "record_allowed", "denied": "report_rejection"},
  )
  builder.add_edge("record_allowed", END)
  builder.add_edge("report_rejection", END)

  return builder.compile()


def main():
  """
  Upserts the action policy, then runs an allowed and a blocked purchase.
  """
  client = LimetryClient()
  client.upsert_policy(ACTION_POLICY)
  graph = build_graph(client)

  print(f"[*] LangGraph action agent against {client.base_url}")

  allowed = graph.invoke({
    "merchant_id": "merchant_vector_db",
    "merchant_name": "Vector DB Cloud",
    "amount_minor": 2000,
    "memo": "Vector database starter plan",
  })
  print(f"[*] $20.00 vector DB plan  -> {allowed['result']}")

  blocked = graph.invoke({
    "merchant_id": "merchant_vector_db",
    "merchant_name": "Vector DB Cloud",
    "amount_minor": 9000,
    "memo": "Vector database enterprise plan",
  })
  print(f"[*] $90.00 enterprise plan -> {blocked['result']}")


if __name__ == "__main__":
  main()
