"""Tests for URL resolution and version helpers."""

from limetry import (
    DEFAULT_LIMETRY_BASE_URL,
    app_version,
    resolve_app_version,
    resolve_limetry_base_url,
    resolve_limetry_cloud_base_url,
)


def test_resolve_base_url_override() -> None:
    assert resolve_limetry_base_url({}, "https://example.com/") == "https://example.com"


def test_resolve_base_url_env() -> None:
    assert resolve_limetry_base_url({"LIMETRY_BASE_URL": "https://api.dev/"}) == (
        "https://api.dev"
    )


def test_resolve_base_url_default() -> None:
    assert resolve_limetry_base_url({}) == DEFAULT_LIMETRY_BASE_URL


def test_resolve_cloud_base_url() -> None:
    assert resolve_limetry_cloud_base_url(
        {"LIMETRY_CLOUD_BASE_URL": "https://cloud.example/"},
    ) == "https://cloud.example"


def test_app_version_release() -> None:
    info = resolve_app_version({"NODE_ENV": "production"})
    assert info["channel"] == "release"
    assert info["label"].startswith("v")
    assert app_version({"NODE_ENV": "production"}) == info["label"]
