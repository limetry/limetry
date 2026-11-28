"""Canonical Limetry product origins for OSS and Cloud."""

from __future__ import annotations

import os
from typing import Mapping

LIMETRY_OSS_ORIGINS = {
    "web": "https://limetry.org",
    "api": "https://api.limetry.org",
    "app": "https://app.limetry.com",
}

LIMETRY_CLOUD_ORIGINS = {
    "web": "https://limetry.com",
    "api": "https://api.limetry.com",
    "app": "https://app.limetry.com",
    "ossApi": "https://api.limetry.com",
}

DEFAULT_LIMETRY_BASE_URL = LIMETRY_OSS_ORIGINS["api"]
DEFAULT_LIMETRY_CLOUD_BASE_URL = LIMETRY_CLOUD_ORIGINS["api"]
LIMETRY_CLOUD_APP_ORIGIN = LIMETRY_CLOUD_ORIGINS["app"]


def resolve_limetry_base_url(
    source: Mapping[str, str] | None = None,
    override: str | None = None,
) -> str:
    """Resolve the Limetry API base URL from env or OSS production default."""
    env = source if source is not None else os.environ
    trimmed_override = override.strip() if override else ""
    trimmed_env = (env.get("LIMETRY_BASE_URL") or "").strip()
    raw = (
        trimmed_override
        if trimmed_override
        else trimmed_env
        if trimmed_env
        else DEFAULT_LIMETRY_BASE_URL
    )
    return raw.rstrip("/")


def resolve_limetry_cloud_base_url(
    source: Mapping[str, str] | None = None,
    override: str | None = None,
) -> str:
    """Resolve the Limetry Cloud BFF base URL from env or production default."""
    env = source if source is not None else os.environ
    trimmed_override = override.strip() if override else ""
    trimmed_env = (
        (env.get("LIMETRY_CLOUD_BASE_URL") or "").strip()
        or (env.get("NEXT_PUBLIC_HOSTED_API_URL") or "").strip()
        or (env.get("HOSTED_PUBLIC_API_URL") or "").strip()
    )
    raw = (
        trimmed_override
        if trimmed_override
        else trimmed_env
        if trimmed_env
        else DEFAULT_LIMETRY_CLOUD_BASE_URL
    )
    return raw.rstrip("/")
