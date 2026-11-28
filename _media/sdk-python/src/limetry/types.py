"""Shared contracts for Limetry policy evaluation and agent tooling."""

from __future__ import annotations

from typing import Literal, NotRequired, TypedDict, Union

PolicyStatus = Literal["active", "suspended", "revoked"]

IntentStatus = Literal[
    "draft",
    "pending_policy_evaluation",
    "approved",
    "rejected",
    "expired",
    "signed",
    "executed",
]

ActionDecision = Literal["allow", "deny", "approval_required"]


class TransactionCategorySoftware(TypedDict):
    kind: Literal["SoftwareSubscription"]


class TransactionCategoryCloud(TypedDict):
    kind: Literal["CloudInfrastructure"]


class TransactionCategoryProfessional(TypedDict):
    kind: Literal["ProfessionalServices"]


class TransactionCategoryMarketplace(TypedDict):
    kind: Literal["Marketplace"]


class TransactionCategoryOther(TypedDict):
    kind: Literal["Other"]
    label: str


TransactionCategory = Union[
    TransactionCategorySoftware,
    TransactionCategoryCloud,
    TransactionCategoryProfessional,
    TransactionCategoryMarketplace,
    TransactionCategoryOther,
]


class SpendingLimits(TypedDict):
    max_single_transaction_minor: int
    max_daily_spend_minor: int
    max_monthly_spend_minor: int
    currency: str


class VelocityLimits(TypedDict):
    max_transactions_per_minute: int
    max_transactions_per_hour: int
    max_transactions_per_day: int
    max_aggregate_amount_per_hour_minor: int


class ReplayProtectionConfig(TypedDict):
    nonce_window_seconds: int
    max_clock_skew_seconds: int
    require_monotonic_nonce: bool


class IsolationBounds(TypedDict):
    max_concurrent_pending_intents: int
    max_pending_aggregate_minor: int
    intent_ttl_seconds: int
    enforce_unique_payee_per_intent_batch: bool


class DestinationRules(TypedDict):
    allowed_merchant_ids: list[str]
    allowed_mcc_codes: list[str]
    blocked_merchant_ids: list[str]
    require_merchant_allowlist: bool


class EffectiveWindow(TypedDict):
    effective_from: str
    expires_at: str | None


class SpendingPolicy(TypedDict):
    policy_id: str
    version: int
    organization_id: str
    agent_id: str
    limits: SpendingLimits
    velocity: VelocityLimits
    replay: ReplayProtectionConfig
    isolation: IsolationBounds
    destination_rules: DestinationRules
    effective_window: EffectiveWindow
    status: PolicyStatus
    updated_at: str


class MoneyAmount(TypedDict):
    amount_minor: int
    currency: str


class ActionIntent(TypedDict):
    intent_id: str
    policy_id: str
    agent_id: str
    action_type: str
    resource: str
    issued_at: str
    cost: NotRequired[MoneyAmount]
    metadata: NotRequired[dict[str, str]]
    nonce: NotRequired[str | int]


class ActionPolicy(TypedDict):
    policy_id: str
    version: int
    organization_id: str
    agent_id: str
    allowed_action_types: list[str]
    status: PolicyStatus
    updated_at: str
    denied_action_types: NotRequired[list[str]]
    allowed_resource_patterns: NotRequired[list[str]]
    blocked_resource_patterns: NotRequired[list[str]]
    max_cost_minor: NotRequired[int]
    currency: NotRequired[str]
    require_approval_action_types: NotRequired[list[str]]
    require_approval_resource_patterns: NotRequired[list[str]]
    approval_cost_minor: NotRequired[int]
    audit_mode: NotRequired[Literal["minimal", "forensics"]]
    effective_from: NotRequired[str]
    expires_at: NotRequired[str | None]


class PayeeDescriptor(TypedDict):
    merchant_id: str
    merchant_name: str
    mcc_code: str | None
    routing_hint: str | None


class TransactionIntent(TypedDict):
    intent_id: str
    policy_id: str
    agent_id: str
    amount: MoneyAmount
    payee: PayeeDescriptor
    category: TransactionCategory
    memo: str
    issued_at: str
    expires_at: str
    nonce: int
    idempotency_key: str
    metadata: dict[str, str]
    status: IntentStatus


class EvaluationState(TypedDict):
    velocity_ledger: dict[str, object]
    replay_store: dict[str, object]


class ActionEvaluationOutcome(TypedDict):
    approved: bool
    intent_id: str
    evaluated_at: str
    decision: NotRequired[ActionDecision]
    reasons: NotRequired[list[str]]
    decision_id: NotRequired[str]
    approval_id: NotRequired[str]


class ActionEvaluationResponse(TypedDict):
    ok: bool
    approved: NotRequired[bool]
    decision: NotRequired[ActionDecision]
    reasons: NotRequired[list[str]]
    decision_id: NotRequired[str]
    approval_id: NotRequired[str]
    receipt: NotRequired[object]
    outcome: NotRequired[ActionEvaluationOutcome]
    state: NotRequired[EvaluationState]
    violation: NotRequired[dict[str, object]]
    error: NotRequired[str]
