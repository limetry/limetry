"""Error classes thrown by the Limetry Python SDK."""


class LimetryError(Exception):
    """Base error for Limetry SDK failures with a stable machine-readable code."""

    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.name = "LimetryError"


class PolicyViolationError(LimetryError):
    """Raised when policy evaluation rejects an intent."""

    def __init__(self, violation: dict[str, object]) -> None:
        raw_code = violation.get("code")
        code = raw_code if isinstance(raw_code, str) else "policy_violation"
        super().__init__(code, f"Policy violation: {code}")
        self.name = "PolicyViolationError"
        self.violation = violation


class RateLimitExceededError(LimetryError):
    """Raised when a client-side velocity circuit breaker blocks a transaction."""

    def __init__(self, cooldown_period_ms: int, elapsed_ms: int) -> None:
        super().__init__(
            "rate_limit_exceeded",
            (
                "Transaction blocked by client velocity circuit breaker. "
                f"Cooldown {cooldown_period_ms}ms, elapsed {elapsed_ms}ms"
            ),
        )
        self.name = "RateLimitExceededError"
        self.cooldown_period_ms = cooldown_period_ms
        self.elapsed_ms = elapsed_ms


class EngineLoadError(LimetryError):
    """Raised when a remote policy engine fails to load or respond."""

    def __init__(self, message: str) -> None:
        super().__init__("engine_load_error", message)
        self.name = "EngineLoadError"


class PaymentInterceptionError(LimetryError):
    """Raised when payment tool interception cannot proceed safely."""

    def __init__(self, message: str) -> None:
        super().__init__("payment_interception_error", message)
        self.name = "PaymentInterceptionError"
