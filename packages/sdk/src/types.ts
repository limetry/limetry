/**
 * Shared TypeScript contracts for Limetry policy evaluation and agent tooling.
 *
 * Covers spending and action policies, transaction/action intents, evaluation
 * request/response shapes, and chat-completion client stubs used by adapters.
 */

/**
 * Lifecycle status of a published spending or action policy.
 */
export type PolicyStatus = "active" | "suspended" | "revoked"

/**
 * Lifecycle status of a spending {@link TransactionIntent}.
 */
export type IntentStatus =
  | "draft"
  | "pending_policy_evaluation"
  | "approved"
  | "rejected"
  | "expired"
  | "signed"
  | "executed"

/**
 * Merchant / spend category discriminator for payment intents.
 *
 * `Other` carries a free-form `label`; other kinds are fixed tags.
 */
export type TransactionCategory =
  | { kind: "SoftwareSubscription" }
  | { kind: "CloudInfrastructure" }
  | { kind: "ProfessionalServices" }
  | { kind: "Marketplace" }
  | { kind: "Other"; label: string }

/**
 * Currency-denominated spending caps in minor units (for example cents).
 */
export type SpendingLimits = {
  /**
   * Maximum amount allowed for a single transaction.
   */
  max_single_transaction_minor: number
  /**
   * Maximum aggregate spend allowed within a rolling day.
   */
  max_daily_spend_minor: number
  /**
   * Maximum aggregate spend allowed within a rolling month.
   */
  max_monthly_spend_minor: number
  /**
   * ISO 4217 currency code applying to the minor-unit amounts.
   */
  currency: string
}

/**
 * Rate and volume caps that bound how fast an agent may spend.
 */
export type VelocityLimits = {
  /**
   * Maximum number of transactions allowed per minute.
   */
  max_transactions_per_minute: number
  /**
   * Maximum number of transactions allowed per hour.
   */
  max_transactions_per_hour: number
  /**
   * Maximum number of transactions allowed per day.
   */
  max_transactions_per_day: number
  /**
   * Maximum aggregate spend (minor units) allowed per hour.
   */
  max_aggregate_amount_per_hour_minor: number
}

/**
 * Nonce and clock rules that defend against replayed intents.
 */
export type ReplayProtectionConfig = {
  /**
   * How long (seconds) a nonce remains valid after issue.
   */
  nonce_window_seconds: number
  /**
   * Maximum allowed clock skew (seconds) when validating timestamps.
   */
  max_clock_skew_seconds: number
  /**
   * When true, nonces must increase monotonically per agent.
   */
  require_monotonic_nonce: boolean
}

/**
 * Concurrency and TTL bounds for in-flight payment intents.
 */
export type IsolationBounds = {
  /**
   * Maximum number of pending intents allowed at once.
   */
  max_concurrent_pending_intents: number
  /**
   * Maximum aggregate pending amount (minor units).
   */
  max_pending_aggregate_minor: number
  /**
   * Time-to-live (seconds) for a pending intent before expiry.
   */
  intent_ttl_seconds: number
  /**
   * When true, a batch may not target the same payee more than once.
   */
  enforce_unique_payee_per_intent_batch: boolean
}

/**
 * Merchant and MCC allow/block rules for payment destinations.
 */
export type DestinationRules = {
  /**
   * Merchant IDs that are explicitly allowed.
   */
  allowed_merchant_ids: string[]
  /**
   * Merchant Category Codes that are explicitly allowed.
   */
  allowed_mcc_codes: string[]
  /**
   * Merchant IDs that are explicitly blocked.
   */
  blocked_merchant_ids: string[]
  /**
   * When true, payees must appear on `allowed_merchant_ids`.
   */
  require_merchant_allowlist: boolean
}

/**
 * Inclusive start and optional end of a policy's effective period (ISO-8601).
 */
export type EffectiveWindow = {
  /**
   * Instant from which the policy is effective.
   */
  effective_from: string
  /**
   * Instant at which the policy stops being effective, or `null` if open-ended.
   */
  expires_at: string | null
}

/**
 * Full spending policy document evaluated for payment {@link TransactionIntent}s.
 */
export type SpendingPolicy = {
  /**
   * Stable identifier for this policy document.
   */
  policy_id: string
  /**
   * Monotonic policy revision number.
   */
  version: number
  /**
   * Tenant / organization that owns the policy.
   */
  organization_id: string
  /**
   * Agent identity the policy governs.
   */
  agent_id: string
  /**
   * Per-transaction and aggregate spend caps.
   */
  limits: SpendingLimits
  /**
   * Velocity / rate limits.
   */
  velocity: VelocityLimits
  /**
   * Replay-protection settings.
   */
  replay: ReplayProtectionConfig
  /**
   * Pending-intent isolation bounds.
   */
  isolation: IsolationBounds
  /**
   * Destination allow/block rules.
   */
  destination_rules: DestinationRules
  /**
   * Time window during which the policy is active.
   */
  effective_window: EffectiveWindow
  /**
   * Current lifecycle status.
   */
  status: PolicyStatus
  /**
   * Last update timestamp (ISO-8601).
   */
  updated_at: string
}

/**
 * Generic agent action intent evaluated by {@link PolicyEngine.evaluateAction}.
 */
export type ActionIntent = {
  /**
   * Caller-supplied intent identifier (idempotency / correlation).
   */
  intent_id: string
  /**
   * Policy document to evaluate against.
   */
  policy_id: string
  /**
   * Agent that issued the intent.
   */
  agent_id: string
  /**
   * Action verb / type string (for example `http.request` or `db.query`).
   */
  action_type: string
  /**
   * Target resource identifier (URL, ARN, table, etc.).
   */
  resource: string
  /**
   * Optional cost associated with the action, in minor units.
   */
  cost?: { amount_minor: number; currency: string }
  /**
   * Optional string key/value bag attached to the intent.
   */
  metadata?: Record<string, string>
  /**
   * Issue timestamp (ISO-8601).
   */
  issued_at: string
  /**
   * Optional replay nonce (string or number depending on caller).
   */
  nonce?: string | number
}

/**
 * Generic action policy constraining which actions an agent may perform.
 */
export type ActionPolicy = {
  /**
   * Stable identifier for this policy document.
   */
  policy_id: string
  /**
   * Monotonic policy revision number.
   */
  version: number
  /**
   * Tenant / organization that owns the policy.
   */
  organization_id: string
  /**
   * Agent identity the policy governs.
   */
  agent_id: string
  /**
   * Action types that are permitted when other rules pass.
   */
  allowed_action_types: string[]
  /**
   * Action types that are always denied.
   */
  denied_action_types?: string[]
  /**
   * Glob/pattern list of resources that are allowed.
   */
  allowed_resource_patterns?: string[]
  /**
   * Glob/pattern list of resources that are blocked.
   */
  blocked_resource_patterns?: string[]
  /**
   * Maximum allowed `intent.cost.amount_minor` when cost is present.
   */
  max_cost_minor?: number
  /**
   * Currency expected for cost checks when set.
   */
  currency?: string
  /**
   * Action types that pass allow rules but still require human approval.
   */
  require_approval_action_types?: string[]
  /**
   * Resource patterns that force approval when matched.
   */
  require_approval_resource_patterns?: string[]
  /**
   * Cost threshold (inclusive) that forces approval when intent.cost is set.
   */
  approval_cost_minor?: number
  /**
   * How much intent content to retain in audit storage after secret scrubbing.
   * Defaults to minimal when omitted.
   */
  audit_mode?: "minimal" | "forensics"
  /**
   * Current lifecycle status.
   */
  status: PolicyStatus
  /**
   * Last update timestamp (ISO-8601).
   */
  updated_at: string
  /**
   * Optional start of the effective window (ISO-8601).
   */
  effective_from?: string
  /**
   * Optional end of the effective window, or `null` if open-ended.
   */
  expires_at?: string | null
}

/**
 * Decision returned for an evaluated {@link ActionIntent}.
 */
export type ActionDecision = "allow" | "deny" | "approval_required"

/**
 * Payee identity attached to a payment {@link TransactionIntent}.
 */
export type PayeeDescriptor = {
  /**
   * Merchant identifier used for allow/block matching.
   */
  merchant_id: string
  /**
   * Human-readable merchant name.
   */
  merchant_name: string
  /**
   * Merchant Category Code, or `null` when unknown.
   */
  mcc_code: string | null
  /**
   * Optional rail / routing hint for the payment processor.
   */
  routing_hint: string | null
}

/**
 * Monetary amount in minor units plus currency code.
 */
export type MoneyAmount = {
  /**
   * Amount in minor units (for example cents).
   */
  amount_minor: number
  /**
   * ISO 4217 currency code.
   */
  currency: string
}

/**
 * Payment intent subject to spending-policy evaluation.
 */
export type TransactionIntent = {
  /**
   * Unique intent identifier.
   */
  intent_id: string
  /**
   * Policy document governing this intent.
   */
  policy_id: string
  /**
   * Agent that issued the intent.
   */
  agent_id: string
  /**
   * Amount to transfer.
   */
  amount: MoneyAmount
  /**
   * Destination merchant descriptor.
   */
  payee: PayeeDescriptor
  /**
   * Spend category for reporting and policy rules.
   */
  category: TransactionCategory
  /**
   * Short human-readable memo.
   */
  memo: string
  /**
   * Issue timestamp (ISO-8601).
   */
  issued_at: string
  /**
   * Expiry timestamp (ISO-8601).
   */
  expires_at: string
  /**
   * Monotonic replay nonce.
   */
  nonce: number
  /**
   * Caller idempotency key for safe retries.
   */
  idempotency_key: string
  /**
   * Opaque string metadata bag.
   */
  metadata: Record<string, string>
  /**
   * Current intent lifecycle status.
   */
  status: IntentStatus
}

/**
 * Opaque engine state returned alongside spending evaluations.
 *
 * Shape is engine-defined; clients should treat fields as pass-through.
 */
export type EvaluationState = {
  /**
   * Velocity ledger snapshot from the evaluating engine.
   */
  velocity_ledger: Record<string, unknown>
  /**
   * Replay-store snapshot from the evaluating engine.
   */
  replay_store: Record<string, unknown>
}

/**
 * Successful spending-policy evaluation outcome summary.
 */
export type EvaluationOutcome = {
  /**
   * Whether the intent was approved.
   */
  approved: boolean
  /**
   * Evaluated intent identifier.
   */
  intent_id: string
  /**
   * Evaluation timestamp (ISO-8601).
   */
  evaluated_at: string
  /**
   * Remaining daily spend capacity in minor units after this decision.
   */
  remaining_daily_spend_minor: number
  /**
   * Remaining single-transaction capacity in minor units after this decision.
   */
  remaining_single_transaction_minor: number
}

/**
 * Discriminated response for spending-policy evaluation.
 *
 * `ok: true` carries an {@link EvaluationOutcome}; `ok: false` carries a
 * violation object and/or error string.
 */
export type PolicyEvaluationResponse =
  | {
    /**
     * Indicates a successful evaluation path.
     */
    ok: true
    /**
     * Approved/denied outcome details.
     */
    outcome: EvaluationOutcome
    /**
     * Updated engine state after evaluation.
     */
    state: EvaluationState
  }
  | {
    /**
     * Indicates a failed or rejected evaluation path.
     */
    ok: false
    /**
     * Structured policy violation payload when available.
     */
    violation?: Record<string, unknown>
    /**
     * Human-readable error when no structured violation is present.
     */
    error?: string
    /**
     * Optional engine state after the failed evaluation.
     */
    state?: EvaluationState
  }

/**
 * Outcome summary for an action-policy evaluation.
 */
export type ActionEvaluationOutcome = {
  /**
   * Whether the action was approved (allow path).
   */
  approved: boolean
  /**
   * Explicit decision enum when the server provides one.
   */
  decision?: ActionDecision
  /**
   * Evaluated intent identifier.
   */
  intent_id: string
  /**
   * Evaluation timestamp (ISO-8601).
   */
  evaluated_at: string
  /**
   * Human-readable reasons for the decision.
   */
  reasons?: string[]
  /**
   * Stable decision identifier for audit correlation.
   */
  decision_id?: string
  /**
   * Approval workflow identifier when `decision` is `approval_required`.
   */
  approval_id?: string
}

/**
 * Discriminated response for action-policy evaluation.
 *
 * Success payloads may include a nested `outcome`, top-level decision fields,
 * and an optional receipt; failure payloads mirror spending evaluation errors.
 */
export type ActionEvaluationResponse =
  | {
    /**
     * Indicates a successful evaluation path.
     */
    ok: true
    /**
     * Convenience approved flag mirrored from the outcome when present.
     */
    approved?: boolean
    /**
     * Explicit decision enum when provided by the engine.
     */
    decision?: ActionDecision
    /**
     * Human-readable reasons for the decision.
     */
    reasons?: string[]
    /**
     * Stable decision identifier for audit correlation.
     */
    decision_id?: string
    /**
     * Approval workflow identifier when approval is required.
     */
    approval_id?: string
    /**
     * Opaque decision receipt returned by the server.
     */
    receipt?: Record<string, unknown>
    /**
     * Structured outcome summary when provided.
     */
    outcome?: ActionEvaluationOutcome
    /**
     * Optional engine state after evaluation.
     */
    state?: EvaluationState
  }
  | {
    /**
     * Indicates a failed or rejected evaluation path.
     */
    ok: false
    /**
     * Structured policy violation payload when available.
     */
    violation?: Record<string, unknown>
    /**
     * Human-readable error when no structured violation is present.
     */
    error?: string
    /**
     * Optional engine state after the failed evaluation.
     */
    state?: EvaluationState
  }

/**
 * Arguments for a payment-execution tool call intercepted by Limetry adapters.
 */
export type PaymentExecutionToolArgs = {
  /**
   * Destination merchant identifier.
   */
  merchant_id: string
  /**
   * Destination merchant display name.
   */
  merchant_name: string
  /**
   * Transfer amount in minor units.
   */
  amount_minor: number
  /**
   * ISO 4217 currency code.
   */
  currency: string
  /**
   * Short payment memo.
   */
  memo: string
  /**
   * Spend category for the transfer.
   */
  category: TransactionCategory
  /**
   * Idempotency key for the tool invocation.
   */
  idempotency_key: string
}

/**
 * OpenAI-style chat tool call attached to a completion message.
 */
export type ChatToolCall = {
  /**
   * Tool call identifier.
   */
  id: string
  /**
   * Discriminator; currently always `"function"`.
   */
  type: "function"
  /**
   * Function name and JSON-encoded argument string.
   */
  function: {
    /**
     * Registered tool / function name.
     */
    name: string
    /**
     * JSON string of function arguments.
     */
    arguments: string
  }
}

/**
 * Minimal chat-completion request shape accepted by {@link ChatCompletionClient}.
 */
export type ChatCompletionRequest = {
  /**
   * Model identifier passed to the upstream provider.
   */
  model: string
  /**
   * Conversation messages (provider-specific message objects).
   */
  messages: Array<Record<string, unknown>>
  /**
   * Optional tool definitions offered to the model.
   */
  tools?: Array<Record<string, unknown>>
}

/**
 * Minimal chat-completion response shape returned by {@link ChatCompletionClient}.
 */
export type ChatCompletionResponse = {
  /**
   * Completion choices; Limetry adapters read the first message's tool calls.
   */
  choices: Array<{
    /**
     * Assistant message for this choice.
     */
    message: {
      /**
       * Message role (typically `"assistant"`).
       */
      role: string
      /**
       * Text content, or `null` when only tool calls are present.
       */
      content: string | null
      /**
       * Optional tool calls requested by the model.
       */
      tool_calls?: ChatToolCall[]
    }
  }>
}

/**
 * Narrow OpenAI-compatible client surface used to intercept payment tool calls.
 */
export type ChatCompletionClient = {
  /**
   * Chat API namespace.
   */
  chat: {
    /**
     * Completions API namespace.
     */
    completions: {
      /**
       * Creates a chat completion for the given request.
       *
       * @param request - Chat completion request payload.
       * @returns Promise resolving to the provider response.
       */
      create: (request: ChatCompletionRequest) => Promise<ChatCompletionResponse>
    }
  }
}
