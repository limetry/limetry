"""Tests for slim policy builders."""

from limetry import create_slim_action_policy, create_slim_policy


def test_create_slim_policy() -> None:
    policy = create_slim_policy(
        agent_id="agent_a",
        max_single_transaction_minor=5_000,
        max_daily_spend_minor=25_000,
        allowed_merchant_ids=["m1"],
        policy_id="11111111-1111-4111-8111-111111111111",
    )
    assert policy["agent_id"] == "agent_a"
    assert policy["policy_id"] == "11111111-1111-4111-8111-111111111111"
    assert policy["limits"]["max_single_transaction_minor"] == 5_000
    assert policy["destination_rules"]["require_merchant_allowlist"] is True
    assert policy["status"] == "active"


def test_create_slim_action_policy() -> None:
    policy = create_slim_action_policy(
        agent_id="demo_agent",
        allowed_action_types=["http_get"],
        denied_action_types=["deploy"],
        max_cost_minor=100,
        audit_mode="minimal",
        policy_id="22222222-2222-4222-8222-222222222222",
    )
    assert policy["allowed_action_types"] == ["http_get"]
    assert policy["denied_action_types"] == ["deploy"]
    assert policy["max_cost_minor"] == 100
    assert policy["audit_mode"] == "minimal"
