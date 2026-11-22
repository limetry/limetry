"""Helpers that expand a small set of limits into full Limetry policy documents."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal, TypedDict
from uuid import uuid4

from limetry.types import ActionPolicy, SpendingPolicy


class SlimPolicyInput(TypedDict, total=False):
    agent_id: str
    organization_id: str
    max_single_transaction_minor: int
    max_daily_spend_minor: int
    max_monthly_spend_minor: int
    currency: str
    max_transactions_per_minute: int
    allowed_merchant_ids: list[str]
    policy_id: str


class SlimActionPolicyInput(TypedDict, total=False):
    agent_id: str
    organization_id: str
    allowed_action_types: list[str]
    denied_action_types: list[str]
    allowed_resource_patterns: list[str]
    blocked_resource_patterns: list[str]
    max_cost_minor: int
    currency: str
    policy_id: str
    audit_mode: Literal["minimal", "forensics"]
    require_approval_action_types: list[str]
    require_approval_resource_patterns: list[str]
    approval_cost_minor: int


def _now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def create_slim_policy(
    *,
    agent_id: str,
    max_single_transaction_minor: int,
    max_daily_spend_minor: int,
    organization_id: str = "default",
    max_monthly_spend_minor: int | None = None,
    currency: str = "USD",
    max_transactions_per_minute: int = 10,
    allowed_merchant_ids: list[str] | None = None,
    policy_id: str | None = None,
) -> SpendingPolicy:
    """Build a full SpendingPolicy from a small set of limits."""
    resolved_policy_id = policy_id or str(uuid4())
    now = _now_iso()
    allowed = allowed_merchant_ids or []
    max_single = max_single_transaction_minor
    max_daily = max_daily_spend_minor
    max_monthly = max_monthly_spend_minor if max_monthly_spend_minor is not None else max_daily * 30

    return {
        "policy_id": resolved_policy_id,
        "version": 1,
        "organization_id": organization_id,
        "agent_id": agent_id,
        "limits": {
            "max_single_transaction_minor": max_single,
            "max_daily_spend_minor": max_daily,
            "max_monthly_spend_minor": max_monthly,
            "currency": currency,
        },
        "velocity": {
            "max_transactions_per_minute": max_transactions_per_minute,
            "max_transactions_per_hour": max_transactions_per_minute * 20,
            "max_transactions_per_day": max_transactions_per_minute * 100,
            "max_aggregate_amount_per_hour_minor": min(max_daily, max_single * 20),
        },
        "replay": {
            "nonce_window_seconds": 300,
            "max_clock_skew_seconds": 300,
            "require_monotonic_nonce": True,
        },
        "isolation": {
            "max_concurrent_pending_intents": 5,
            "max_pending_aggregate_minor": max_single * 5,
            "intent_ttl_seconds": 300,
            "enforce_unique_payee_per_intent_batch": True,
        },
        "destination_rules": {
            "allowed_merchant_ids": allowed,
            "allowed_mcc_codes": [],
            "blocked_merchant_ids": [],
            "require_merchant_allowlist": len(allowed) > 0,
        },
        "effective_window": {
            "effective_from": now,
            "expires_at": None,
        },
        "status": "active",
        "updated_at": now,
    }


def create_slim_action_policy(
    *,
    agent_id: str,
    allowed_action_types: list[str],
    organization_id: str = "default",
    denied_action_types: list[str] | None = None,
    allowed_resource_patterns: list[str] | None = None,
    blocked_resource_patterns: list[str] | None = None,
    max_cost_minor: int | None = None,
    currency: str | None = None,
    policy_id: str | None = None,
    audit_mode: Literal["minimal", "forensics"] = "minimal",
    require_approval_action_types: list[str] | None = None,
    require_approval_resource_patterns: list[str] | None = None,
    approval_cost_minor: int | None = None,
) -> ActionPolicy:
    """Build a generic ActionPolicy from a small set of action constraints."""
    resolved_policy_id = policy_id or str(uuid4())
    now = _now_iso()

    policy: ActionPolicy = {
        "policy_id": resolved_policy_id,
        "version": 1,
        "organization_id": organization_id,
        "agent_id": agent_id,
        "allowed_action_types": allowed_action_types,
        "audit_mode": audit_mode,
        "status": "active",
        "updated_at": now,
        "effective_from": now,
        "expires_at": None,
    }
    if denied_action_types is not None:
        policy["denied_action_types"] = denied_action_types
    if allowed_resource_patterns is not None:
        policy["allowed_resource_patterns"] = allowed_resource_patterns
    if blocked_resource_patterns is not None:
        policy["blocked_resource_patterns"] = blocked_resource_patterns
    if max_cost_minor is not None:
        policy["max_cost_minor"] = max_cost_minor
    if currency is not None:
        policy["currency"] = currency
    if require_approval_action_types is not None:
        policy["require_approval_action_types"] = require_approval_action_types
    if require_approval_resource_patterns is not None:
        policy["require_approval_resource_patterns"] = require_approval_resource_patterns
    if approval_cost_minor is not None:
        policy["approval_cost_minor"] = approval_cost_minor
    return policy
