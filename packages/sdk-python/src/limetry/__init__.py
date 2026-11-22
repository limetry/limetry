"""
Public entry for the Limetry Python SDK.

Re-exports policy engine clients, typed policy/intent contracts, privacy
helpers for audit projections, and Limetry error classes.
"""

from limetry.compatibility import COMPATIBILITY
from limetry.engine import (
    AsyncRemotePolicyEngine,
    RemotePolicyEngine,
    create_async_remote_engine,
    create_remote_engine,
)
from limetry.errors import (
    EngineLoadError,
    LimetryError,
    PaymentInterceptionError,
    PolicyViolationError,
    RateLimitExceededError,
)
from limetry.policy.slim import create_slim_action_policy, create_slim_policy
from limetry.privacy.redact import (
    DEFAULT_AUDIT_MODE,
    AuditIntentProjection,
    AuditMode,
    build_evaluated_audit_details,
    build_minimized_authorization_request,
    build_minimized_authorization_response,
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
from limetry.urls import (
    DEFAULT_LIMETRY_BASE_URL,
    DEFAULT_LIMETRY_CLOUD_BASE_URL,
    LIMETRY_CLOUD_APP_ORIGIN,
    LIMETRY_CLOUD_ORIGINS,
    LIMETRY_OSS_ORIGINS,
    resolve_limetry_base_url,
    resolve_limetry_cloud_base_url,
)
from limetry.version import (
    APP_VERSION,
    AppVersion,
    AppVersionChannel,
    AppVersionInfo,
    app_version,
    format_app_version_label,
    resolve_app_version,
)

__all__ = [
    "APP_VERSION",
    "AppVersion",
    "AppVersionChannel",
    "AppVersionInfo",
    "AsyncRemotePolicyEngine",
    "AuditIntentProjection",
    "AuditMode",
    "COMPATIBILITY",
    "DEFAULT_AUDIT_MODE",
    "DEFAULT_LIMETRY_BASE_URL",
    "DEFAULT_LIMETRY_CLOUD_BASE_URL",
    "EngineLoadError",
    "LIMETRY_CLOUD_APP_ORIGIN",
    "LIMETRY_CLOUD_ORIGINS",
    "LIMETRY_OSS_ORIGINS",
    "LimetryError",
    "PaymentInterceptionError",
    "PolicyViolationError",
    "RateLimitExceededError",
    "RemotePolicyEngine",
    "app_version",
    "build_evaluated_audit_details",
    "build_minimized_authorization_request",
    "build_minimized_authorization_response",
    "build_recorded_audit_details",
    "create_async_remote_engine",
    "create_remote_engine",
    "create_slim_action_policy",
    "create_slim_policy",
    "format_app_version_label",
    "is_sensitive_key",
    "project_intent_for_audit",
    "redact_action_intent",
    "redact_details",
    "redact_metadata",
    "resolve_app_version",
    "resolve_audit_mode",
    "resolve_limetry_base_url",
    "resolve_limetry_cloud_base_url",
    "scrub_embedded_secrets",
    "scrub_resource",
]
