"""Tests for privacy redaction helpers."""

from limetry import (
    build_evaluated_audit_details,
    build_minimized_authorization_request,
    build_recorded_audit_details,
    is_sensitive_key,
    project_intent_for_audit,
    redact_action_intent,
    redact_details,
    redact_metadata,
    resolve_audit_mode,
    scrub_embedded_secrets,
    scrub_resource,
)


def _base_intent() -> dict:
    return {
        "intent_id": "11111111-1111-4111-8111-111111111111",
        "policy_id": "22222222-2222-4222-8222-222222222222",
        "agent_id": "ci-bot",
        "action_type": "http_post",
        "resource": "https://user:pass@api.example.com/deploy?token=super-secret&x=1",
        "metadata": {
            "note": "ok",
            "api_key": "sk-live-abc",
            "Authorization": "Bearer abc.def",
        },
        "issued_at": "2026-07-27T12:00:00.000Z",
    }


def test_scrub_resource_removes_userinfo_query_hash() -> None:
    assert scrub_resource("https://user:pass@api.example.com/path?token=1#frag") == (
        "https://api.example.com/path"
    )


def test_scrub_resource_strips_query_from_non_url() -> None:
    assert scrub_resource("arn:aws:s3:::bucket?version=1") == "arn:aws:s3:::bucket"


def test_redact_metadata() -> None:
    assert redact_metadata({"api_key": "secret", "note": "Bearer abc123"}) == {
        "api_key": "[REDACTED]",
        "note": "Bearer [REDACTED]",
    }


def test_redact_details_nested() -> None:
    assert redact_details({
        "headers": {"Authorization": "Bearer x", "accept": "json"},
        "body": {"password": "p", "ok": True},
    }) == {
        "headers": {"Authorization": "[REDACTED]", "accept": "json"},
        "body": {"password": "[REDACTED]", "ok": True},
    }


def test_redact_action_intent() -> None:
    redacted = redact_action_intent(_base_intent())  # type: ignore[arg-type]
    assert redacted["resource"] == "https://api.example.com/deploy"
    assert redacted["metadata"]["api_key"] == "[REDACTED]"
    assert redacted["metadata"]["note"] == "ok"


def test_project_intent_minimal_drops_metadata() -> None:
    projected = project_intent_for_audit(_base_intent(), "minimal")  # type: ignore[arg-type]
    assert "metadata" not in projected


def test_project_intent_forensics_keeps_metadata() -> None:
    projected = project_intent_for_audit(_base_intent(), "forensics")  # type: ignore[arg-type]
    assert projected["metadata"]["api_key"] == "[REDACTED]"


def test_build_evaluated_and_recorded() -> None:
    intent = _base_intent()
    evaluated = build_evaluated_audit_details(
        approved=True,
        reasons=["ok"],
        policy_id=intent["policy_id"],
        intent=intent,  # type: ignore[arg-type]
    )
    assert evaluated["approved"] is True
    recorded = build_recorded_audit_details(
        outcome="executed",
        intent=intent,  # type: ignore[arg-type]
        mode="forensics",
        details={"token": "x"},
    )
    assert recorded["details"]["token"] == "[REDACTED]"


def test_resolve_audit_mode() -> None:
    assert resolve_audit_mode({"audit_mode": "forensics"}) == "forensics"
    assert resolve_audit_mode(None, "minimal") == "minimal"
    assert resolve_audit_mode(None, None) == "minimal"


def test_is_sensitive_key_and_scrub_embedded() -> None:
    assert is_sensitive_key("api_key")
    assert "Bearer [REDACTED]" in scrub_embedded_secrets("Authorization Bearer abc.def")


def test_minimized_authorization_request() -> None:
    result = build_minimized_authorization_request(
        tenant_id="default",
        policy_id="p1",
        intent=_base_intent(),  # type: ignore[arg-type]
        intent_digest_hex="abc",
    )
    assert result["intent_digest_hex"] == "abc"
    assert "metadata" not in result["intent"]  # type: ignore[index]
