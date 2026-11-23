"""Product version labels for packages, health, and website footers."""

from __future__ import annotations

import os
import re
from typing import Literal, Mapping, TypedDict

from limetry._build_info import BUILD_INFO

APP_VERSION: str = str(BUILD_INFO.get("version") or "0.0.0")

AppVersionChannel = Literal["release", "dev"]


class AppVersionInfo(TypedDict):
    version: str
    build: int
    channel: AppVersionChannel
    label: str
    footer_label: str


_DEV_COMMIT_ENV_KEYS = (
    "LIMETRY_DEV_COMMITS",
    "NEXT_PUBLIC_LIMETRY_DEV_COMMITS",
    "EXPO_PUBLIC_LIMETRY_DEV_COMMITS",
)

_PUBLIC_VERSION_ENV_KEYS = (
    "LIMETRY_APP_VERSION",
    "NEXT_PUBLIC_LIMETRY_APP_VERSION",
    "EXPO_PUBLIC_LIMETRY_APP_VERSION",
)


def format_app_version_label(
    *,
    version: str,
    build: int,
    channel: AppVersionChannel,
    dev_commits: int,
) -> str:
    """Format the package/CLI version label (no build in release channel)."""
    if channel == "dev":
        return f"v{version}-dev-{dev_commits}"
    return f"v{version}"


def format_app_footer_version_label(
    *,
    version: str,
    build: int,
    channel: AppVersionChannel,
    dev_commits: int,
) -> str:
    """Format the website footer version label (includes build in release)."""
    if channel == "dev":
        return f"v{version}-dev-{dev_commits}"
    return f"v{version}-{build}"


def _read_platform_version() -> str:
    raw = BUILD_INFO.get("version")
    if isinstance(raw, str) and raw.strip():
        return raw.strip()
    return APP_VERSION


def _read_build() -> int:
    raw = BUILD_INFO.get("build")
    if isinstance(raw, int):
        return raw
    return 0


def _is_dev_channel(env: Mapping[str, str]) -> bool:
    if env.get("LIMETRY_FORCE_DEV_VERSION") == "1":
        return True
    if env.get("LIMETRY_ENV") == "production" or env.get("LIMETRY_STATIC_EXPORT") == "1":
        return False
    node_env = env.get("NODE_ENV")
    if node_env in ("production", "test"):
        return False
    # Published packages with unset NODE_ENV are release. Only explicit local
    # signals select the `-dev-Y` channel.
    if node_env == "development":
        return True
    for key in _DEV_COMMIT_ENV_KEYS:
        raw = env.get(key)
        if raw and re.fullmatch(r"\d+", raw):
            return True
    return False


def _read_dev_commits(env: Mapping[str, str]) -> int:
    for key in _DEV_COMMIT_ENV_KEYS:
        raw = env.get(key)
        if raw and re.fullmatch(r"\d+", raw):
            return int(raw)
    return 0


def _read_public_app_version_label(env: Mapping[str, str]) -> str | None:
    for key in _PUBLIC_VERSION_ENV_KEYS:
        raw = (env.get(key) or "").strip()
        if raw:
            return raw
    return None


def _labels_for_parts(
    *,
    version: str,
    build: int,
    channel: AppVersionChannel,
    dev_commits: int,
) -> tuple[str, str]:
    return (
        format_app_version_label(
            version=version,
            build=build,
            channel=channel,
            dev_commits=dev_commits,
        ),
        format_app_footer_version_label(
            version=version,
            build=build,
            channel=channel,
            dev_commits=dev_commits,
        ),
    )


def resolve_app_version(env: Mapping[str, str] | None = None) -> AppVersionInfo:
    """Resolve structured AppVersionInfo from env and embedded build-info."""
    source = env if env is not None else os.environ
    public_label = _read_public_app_version_label(source)
    if public_label:
        legacy_release_match = re.fullmatch(r"v(\d+(?:\.\d+)*)-(\d+)", public_label)
        if legacy_release_match:
            version = legacy_release_match.group(1)
            build = int(legacy_release_match.group(2))
            label, footer_label = _labels_for_parts(
                version=version,
                build=build,
                channel="release",
                dev_commits=0,
            )
            return {
                "version": version,
                "build": build,
                "channel": "release",
                "label": label,
                "footer_label": footer_label,
            }
        bare_release_match = re.fullmatch(r"v(\d+(?:\.\d+)*)", public_label)
        if bare_release_match:
            version = bare_release_match.group(1)
            build = _read_build()
            label, footer_label = _labels_for_parts(
                version=version,
                build=build,
                channel="release",
                dev_commits=0,
            )
            return {
                "version": version,
                "build": build,
                "channel": "release",
                "label": label,
                "footer_label": footer_label,
            }
        dev_match = re.fullmatch(r"v(\d+(?:\.\d+)*)-dev-(\d+)", public_label)
        if dev_match:
            return {
                "version": dev_match.group(1),
                "build": _read_build(),
                "channel": "dev",
                "label": public_label,
                "footer_label": public_label,
            }
        channel: AppVersionChannel = "dev" if _is_dev_channel(source) else "release"
        return {
            "version": _read_platform_version(),
            "build": _read_build(),
            "channel": channel,
            "label": public_label,
            "footer_label": public_label,
        }

    version = _read_platform_version()
    build = _read_build()
    channel = "dev" if _is_dev_channel(source) else "release"
    dev_commits = _read_dev_commits(source) if channel == "dev" else 0
    label, footer_label = _labels_for_parts(
        version=version,
        build=build,
        channel=channel,
        dev_commits=dev_commits,
    )
    return {
        "version": version,
        "build": build,
        "channel": channel,
        "label": label,
        "footer_label": footer_label,
    }


def app_version(env: Mapping[str, str] | None = None) -> str:
    """Return the package version label (e.g. v1.2.102)."""
    return resolve_app_version(env)["label"]


def app_footer_version(env: Mapping[str, str] | None = None) -> str:
    """Return the website footer version label (e.g. v1.2.102-12)."""
    return resolve_app_version(env)["footer_label"]


# Aliases matching TypeScript AppVersion() / AppFooterVersion() naming.
AppVersion = app_version
AppFooterVersion = app_footer_version
