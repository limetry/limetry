/**
 * Multi-tenant HTTP request/response DTOs for `\@limetry/server` auth, users,
 * tokens, and rules routes.
 */

/**
 * Body for `POST /v1/auth/register`.
 */
export interface CreateUserRequest {
  /**
   * User email (unique per tenant after registration mints a tenant id).
   */
  email: string
  /**
   * Plaintext password; hashed before storage.
   */
  password: string
  /**
   * Optional display name.
   */
  name?: string
}

/**
 * Body for `PATCH /v1/profile`.
 */
export interface UpdateUserRequest {
  /**
   * Replacement display name.
   */
  name?: string
  /**
   * Replacement email (reserved for future use on profile routes).
   */
  email?: string
}

/**
 * Body for password rotation endpoints.
 */
export interface ChangePasswordRequest {
  /**
   * Current plaintext password.
   */
  currentPassword: string
  /**
   * New plaintext password.
   */
  newPassword: string
}

/**
 * Body for `POST /v1/tokens`.
 */
export interface CreateTokenRequest {
  /**
   * Human-readable token label.
   */
  name: string
  /**
   * Scopes granted to the bearer API token.
   */
  scopes: string[]
  /**
   * Optional ISO-8601 expiry timestamp.
   */
  expiresAt?: string
}

/**
 * Body for `POST /v1/rules`.
 */
export interface CreateRuleRequest {
  /**
   * Rule display name.
   */
  name: string
  /**
   * Optional longer description.
   */
  description?: string
  /**
   * Condition expression evaluated by consumers.
   */
  condition: string
  /**
   * Action expression applied when the condition matches.
   */
  action: string
  /**
   * Sort / evaluation priority; higher wins when listing.
   */
  priority?: number
}

/**
 * Body for `PATCH /v1/rules/:ruleId`.
 */
export interface UpdateRuleRequest {
  /**
   * Replacement name.
   */
  name?: string
  /**
   * Replacement description.
   */
  description?: string
  /**
   * Replacement condition expression.
   */
  condition?: string
  /**
   * Replacement action expression.
   */
  action?: string
  /**
   * Replacement priority.
   */
  priority?: number
  /**
   * Whether the rule remains eligible for evaluation.
   */
  isActive?: boolean
}

/**
 * Access-token payload returned to clients (plaintext only on create).
 */
export interface TokenResponse {
  /**
   * Token record id.
   */
  id: string
  /**
   * Token label.
   */
  name: string
  /**
   * Plaintext token on create; empty string when listing.
   */
  token: string
  /**
   * Granted scopes.
   */
  scopes: string[]
  /**
   * ISO-8601 creation time.
   */
  createdAt: string
  /**
   * ISO-8601 expiry, or null when non-expiring.
   */
  expiresAt?: string | null
}

/**
 * Successful login/register response with JWT and user summary.
 */
export interface AuthResponse {
  /**
   * Signed JWT (12h TTL).
   */
  token: string
  /**
   * Authenticated user summary.
   */
  user: {
    /**
     * User id.
     */
    id: string
    /**
     * User email.
     */
    email: string
    /**
     * Display name, if set.
     */
    name: string | null
    /**
     * Tenant the user belongs to.
     */
    tenantId: string
  }
}

/**
 * Public user profile shape returned by profile routes.
 */
export interface UserResponse {
  /**
   * User id.
   */
  id: string
  /**
   * User email.
   */
  email: string
  /**
   * Display name, if set.
   */
  name: string | null
  /**
   * Tenant role.
   */
  role: "ADMIN" | "MEMBER"
  /**
   * Whether the account may authenticate.
   */
  isActive: boolean
  /**
   * ISO-8601 creation time.
   */
  createdAt: string
}

/**
 * Public rule shape returned by rules CRUD routes.
 */
export interface RuleResponse {
  /**
   * Rule id.
   */
  id: string
  /**
   * Rule name.
   */
  name: string
  /**
   * Optional description.
   */
  description?: string
  /**
   * Condition expression.
   */
  condition: string
  /**
   * Action expression.
   */
  action: string
  /**
   * Priority.
   */
  priority: number
  /**
   * Active flag.
   */
  isActive: boolean
  /**
   * ISO-8601 creation time.
   */
  createdAt: string
  /**
   * ISO-8601 last update time.
   */
  updatedAt: string
}
