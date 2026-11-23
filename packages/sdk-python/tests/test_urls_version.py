"""Tests for URL resolution and version helpers."""

from limetry import (
    DEFAULT_LIMETRY_BASE_URL,
    app_footer_version,
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
    assert info["label"] == f"v{info['version']}"
    assert info["footer_label"] == f"v{info['version']}-{info['build']}"
    assert app_version({"NODE_ENV": "production"}) == info["label"]
    assert app_footer_version({"NODE_ENV": "production"}) == info["footer_label"]


def test_app_version_unset_node_env_is_release() -> None:
    info = resolve_app_version({})
    assert info["channel"] == "release"
    assert info["label"] == f"v{info['version']}"
    assert "-dev-" not in info["label"]
