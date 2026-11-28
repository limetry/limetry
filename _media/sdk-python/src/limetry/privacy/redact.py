"""Privacy helpers for scrubbing secrets from intents and building audit projections."""

from __future__ import annotations

import re
from typing import Literal, TypedDict
from urllib.parse import urlsplit, urlunsplit

from limetry.types import ActionIntent, MoneyAmount

AuditMode = Literal["minimal", "forensics"]
DEFAULT_AUDIT_MODE: AuditMode = "minimal"

_SENSITIVE_KEY_PATTERN = re.compile(
    r"pass(word|wd)?|secret|token|api[_-]?key|authorization|auth|cookie|"
    r"credential|private[_-]?key|access[_-]?key|refresh|bearer|ssn|"
    r"credit[_-]?card|cvv|session",
    re.IGNORECASE,
)
_REDACTED = "[REDACTED]"


class AuditIntentProjection(TypedDict, total=False):
    intent_id: str
    policy_id: str
    agent_id: str
    action_type: str
    resource: str
    cost: MoneyAmount
    issued_at: str
    metadata: dict[str, str]


def is_sensitive_key(key: str) -> bool:
    """Return whether a metadata/details key name looks like a secret."""
    return _SENSITIVE_KEY_PATTERN.search(key) is not None


def scrub_resource(resource: str) -> str:
    """Strip query string, hash, and URL userinfo from a resource identifier."""
    trimmed = resource.strip()
    if not trimmed:
        return trimmed
    try:
        parts = urlsplit(trimmed)
        if parts.scheme and parts.netloc:
            netloc = parts.hostname or ""
            if parts.port:
                netloc = f"{netloc}:{parts.port}"
            return urlunsplit((parts.scheme, netloc, parts.path, "", ""))
    except ValueError:
        pass
    query_index = trimmed.find("?")
    if query_index >= 0:
        return trimmed[:query_index]
    return trimmed


def scrub_embedded_secrets(value: str) -> str:
    """Redact common secret patterns embedded in free-text / URL query values."""
    next_value = re.sub(
        r"([?&](?:access_token|api_key|token|key|secret|password|auth)=)([^&#]*)",
        rf"\1{_REDACTED}",
        value,
        flags=re.IGNORECASE,
    )
    next_value = re.sub(
        r"\b(Bearer\s+)[A-Za-z0-9\-._~+/]+=*",
        rf"\1{_REDACTED}",
        next_value,
        flags=re.IGNORECASE,
    )
    next_value = re.sub(
        r"\b(sk[-_](?:live|test)[-_][A-Za-z0-9]+)",
        _REDACTED,
        next_value,
    )
    return next_value


def redact_metadata(
    metadata: dict[str, str] | None,
) -> dict[str, str] | None:
    """Drop or redact sensitive keys from a string metadata map."""
    if not metadata:
        return None
    next_map: dict[str, str] = {}
    for key, value in metadata.items():
        if is_sensitive_key(key):
            next_map[key] = _REDACTED
            continue
        next_map[key] = scrub_embedded_secrets(value)
    return next_map if next_map else None


def _redact_unknown_value(value: object) -> object:
    if isinstance(value, str):
        return scrub_embedded_secrets(value)
    if isinstance(value, list):
        return [_redact_unknown_value(entry) for entry in value]
    if isinstance(value, dict):
        return _redact_unknown_record(value)
    return value


def _redact_unknown_record(value: dict[str, object]) -> dict[str, object]:
    next_map: dict[str, object] = {}
    for key, child in value.items():
        if is_sensitive_key(key):
            next_map[key] = _REDACTED
            continue
        next_map[key] = _redact_unknown_value(child)
    return next_map


def redact_details(
    details: dict[str, object] | None,
) -> dict[str, object] | None:
    """Recursively redact sensitive keys and scrub string values."""
    if details is None:
        return None
    return _redact_unknown_record(details)


def redact_action_intent(intent: ActionIntent) -> ActionIntent:
    """Return an ActionIntent safe to log after secret scrubbing."""
    redacted: ActionIntent = {
        **intent,
        "resource": scrub_resource(intent["resource"]),
    }
    metadata = redact_metadata(intent.get("metadata"))
    if metadata is not None:
        redacted["metadata"] = metadata
    elif "metadata" in redacted:
        del redacted["metadata"]  # type: ignore[misc]
    return redacted


def project_intent_for_audit(
    intent: ActionIntent,
    mode: AuditMode = DEFAULT_AUDIT_MODE,
) -> AuditIntentProjection:
    """Build the intent payload stored in audit / authorization rows."""
    redacted = redact_action_intent(intent)
    projected: AuditIntentProjection = {
        "intent_id": redacted["intent_id"],
        "policy_id": redacted["policy_id"],
        "agent_id": redacted["agent_id"],
        "action_type": redacted["action_type"],
        "resource": redacted["resource"],
        "issued_at": redacted["issued_at"],
    }
    if "cost" in redacted:
        projected["cost"] = redacted["cost"]
    if mode == "forensics" and "metadata" in redacted:
        projected["metadata"] = redacted["metadata"]
    return projected


def build_evaluated_audit_details(
    *,
    approved: bool,
    reasons: list[str],
    policy_id: str,
    intent: ActionIntent,
    mode: AuditMode | None = None,
    legacy: bool = False,
) -> dict[str, object]:
    """Build the details blob for policy.evaluated audit events."""
    resolved_mode = mode or DEFAULT_AUDIT_MODE
    projected = project_intent_for_audit(intent, resolved_mode)
    details: dict[str, object] = {
        "approved": approved,
        "reasons": reasons,
        "policy_id": policy_id,
        "agent_id": projected["agent_id"],
        "action_type": projected["action_type"],
        "resource": projected["resource"],
        "audit_mode": resolved_mode,
        "intent": projected,
    }
    if legacy:
        details["legacy"] = True
    return details


def build_recorded_audit_details(
    *,
    outcome: Literal["executed", "skipped", "blocked"],
    intent: ActionIntent,
    decision_id: str | None = None,
    details: dict[str, object] | None = None,
    mode: AuditMode | None = None,
) -> dict[str, object]:
    """Build the details blob for action.recorded audit events."""
    resolved_mode = mode or DEFAULT_AUDIT_MODE
    projected = project_intent_for_audit(intent, resolved_mode)
    base: dict[str, object] = {
        "outcome": outcome,
        "decision_id": decision_id,
        "agent_id": projected["agent_id"],
        "action_type": projected["action_type"],
        "resource": projected["resource"],
        "audit_mode": resolved_mode,
        "intent": projected,
    }
    if resolved_mode == "forensics":
        base["details"] = redact_details(details) or {}
    return base


def resolve_audit_mode(
    policy: dict[str, object] | None = None,
    env_default: str | None = None,
) -> AuditMode:
    """Resolve audit mode from a policy document or environment default."""
    from_policy = None if policy is None else policy.get("audit_mode")
    if from_policy in ("minimal", "forensics"):
        return from_policy  # type: ignore[return-value]
    if env_default in ("minimal", "forensics"):
        return env_default  # type: ignore[return-value]
    return DEFAULT_AUDIT_MODE


def build_minimized_authorization_request(
    *,
    tenant_id: str,
    policy_id: str,
    intent: ActionIntent,
    intent_digest_hex: str,
    mode: AuditMode | None = None,
) -> dict[str, object]:
    """Build a minimized authorization request projection for Cloud persistence."""
    resolved_mode = mode or DEFAULT_AUDIT_MODE
    return {
        "tenant_id": tenant_id,
        "policy_id": policy_id,
        "intent_digest_hex": intent_digest_hex,
        "audit_mode": resolved_mode,
        "intent": project_intent_for_audit(intent, resolved_mode),
    }


def build_minimized_authorization_response(
    *,
    decision: Literal["allow", "deny"],
    reasons: list[str],
    intent_digest_hex: str,
    decision_id: str | None = None,
    authorization_id: str | None = None,
    expires_at: str | None = None,
    decision_receipt: object | None = None,
) -> dict[str, object]:
    """Build a minimized authorization response projection for Cloud persistence."""
    return {
        "decision": decision,
        "reasons": reasons,
        "decision_id": decision_id,
        "authorization_id": authorization_id,
        "intent_digest_hex": intent_digest_hex,
        "expires_at": expires_at,
        "decision_receipt": decision_receipt,
    }
