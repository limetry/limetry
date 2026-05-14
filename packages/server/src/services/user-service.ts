/**
 * User, access-token, and rules persistence port plus in-memory implementation.
 */

import { createHash, randomBytes, timingSafeEqual } from "node:crypto"

import bcrypt from "bcryptjs"

/**
 * Prefix marking bcrypt password hashes.
 */
const BCRYPT_PREFIX = "bcrypt:"

/**
 * Prefix marking legacy SHA-256 password hashes.
 */
const SHA256_PREFIX = "sha256:"

/**
 * Hashes a plaintext password with bcrypt (cost 12) and prefixes `bcrypt:`.
 *
 * @param password - Plaintext password.
 * @returns Prefixed hash string for storage.
 */
export function hashPassword(password: string): string {
  const hash = bcrypt.hashSync(password, 12)
  return `${BCRYPT_PREFIX}${hash}`
}

/**
 * Verifies a plaintext password against a stored hash (bcrypt or legacy SHA-256).
 *
 * @param passwordHash - Stored hash with scheme prefix.
 * @param password - Candidate plaintext.
 * @returns Whether the password matches.
 */
export function verifyPasswordHash(passwordHash: string, password: string): boolean {
  if (passwordHash.startsWith(BCRYPT_PREFIX)) {
    return bcrypt.compareSync(password, passwordHash.slice(BCRYPT_PREFIX.length))
  }

  if (passwordHash.startsWith(SHA256_PREFIX)) {
    const storedHex = passwordHash.slice(SHA256_PREFIX.length)
    /**
     * Legacy backward-compat path; new passwords always use bcrypt.
     * lgtm[js/insufficient-password-hash]
     */
    const computedHex = createHash("sha256").update(password, "utf8").digest("hex")
    const storedBuf = Buffer.from(storedHex, "hex")
    const computedBuf = Buffer.from(computedHex, "hex")
    if (storedBuf.length !== computedBuf.length || storedBuf.length === 0) {
      return false
    }
    return timingSafeEqual(storedBuf, computedBuf)
  }

  return false
}

/**
 * SHA-256 hex digest of an API token value for storage.
 *
 * @param tokenValue - Plaintext API token.
 * @returns Hex digest.
 */
export function hashApiToken(tokenValue: string): string {
  return createHash("sha256").update(tokenValue, "utf8").digest("hex")
}

/**
 * Constant-time comparison of a stored token hash against a presented plaintext token.
 *
 * @param storedHashHex - Stored SHA-256 hex.
 * @param presentedToken - Plaintext token from the client.
 * @returns Whether they match.
 */
export function apiTokensEqual(storedHashHex: string, presentedToken: string): boolean {
  const presentedHash = Buffer.from(hashApiToken(presentedToken), "hex")
  const storedHash = Buffer.from(storedHashHex, "hex")

  if (presentedHash.length !== storedHash.length || presentedHash.length === 0) {
    return false
  }

  return timingSafeEqual(presentedHash, storedHash)
}

/**
 * Generates a new plaintext API token with `limetry_` prefix.
 *
 * @returns Random token string.
 */
function generateToken(): string {
  return "limetry_" + randomBytes(24).toString("hex")
}

/**
 * Persisted user record.
 */
export interface StoredUser {
  /**
   * User id.
   */
  id: string
  /**
   * Tenant id.
   */
  tenantId: string
  /**
   * Email (unique per tenant).
   */
  email: string
  /**
   * Display name.
   */
  name: string | null
  /**
   * Prefixed password hash.
   */
  passwordHash: string
  /**
   * Tenant role.
   */
  role: "ADMIN" | "MEMBER"
  /**
   * Whether the account may authenticate.
   */
  isActive: boolean
  /**
   * Creation time.
   */
  createdAt: Date
  /**
   * Last update time.
   */
  updatedAt: Date
}

/**
 * Persisted API access-token record (hash only; plaintext never stored).
 */
export interface StoredAccessToken {
  /**
   * Token record id.
   */
  id: string
  /**
   * Tenant id.
   */
  tenantId: string
  /**
   * Owning user id.
   */
  userId: string
  /**
   * Human label.
   */
  name: string
  /**
   * SHA-256 hex digest of the API token. The plaintext is only returned once at creation.
   */
  tokenHash: string
  /**
   * Granted scopes.
   */
  scopes: string[]
  /**
   * Whether the token may authenticate.
   */
  isActive: boolean
  /**
   * Optional expiry.
   */
  expiresAt: Date | null
  /**
   * Last successful auth time.
   */
  lastUsedAt: Date | null
  /**
   * Creation time.
   */
  createdAt: Date
  /**
   * Last update time.
   */
  updatedAt: Date
}

/**
 * Result of creating an access token (includes one-time plaintext).
 */
export type CreatedAccessToken = {
  /**
   * Persisted record with hash only.
   */
  record: StoredAccessToken
  /**
   * Plaintext token shown once to the client.
   */
  plaintextToken: string
}

/**
 * Persisted tenant rule record.
 */
export interface StoredRule {
  /**
   * Rule id.
   */
  id: string
  /**
   * Tenant id.
   */
  tenantId: string
  /**
   * Rule name.
   */
  name: string
  /**
   * Optional description.
   */
  description: string | null
  /**
   * Condition expression.
   */
  condition: string
  /**
   * Action expression.
   */
  action: string
  /**
   * Active flag.
   */
  isActive: boolean
  /**
   * Priority.
   */
  priority: number
  /**
   * Creation time.
   */
  createdAt: Date
  /**
   * Last update time.
   */
  updatedAt: Date
}

/**
 * Sync or async return wrapper for store methods.
 *
 * @typeParam T - Resolved value type.
 */
type MaybePromise<T> = T | Promise<T>

/**
 * Port for users, API tokens, and rules.
 */
export interface UserService {
  /**
   * Creates a user in a tenant.
   *
   * @param email - Email address.
   * @param password - Plaintext password.
   * @param name - Display name.
   * @param tenantId - Tenant scope.
   * @param role - Role; defaults to MEMBER.
   * @returns Created user.
   * @throws When the email already exists in the tenant.
   */
  createUser(
    email: string,
    password: string,
    name: string | null,
    tenantId: string,
    role?: "ADMIN" | "MEMBER",
  ): MaybePromise<StoredUser>
  /**
   * Looks up a user by id.
   *
   * @param userId - User id.
   * @returns User or `null`.
   */
  getUserById(userId: string): MaybePromise<StoredUser | null>
  /**
   * Looks up a user by tenant + email.
   *
   * @param tenantId - Tenant scope.
   * @param email - Email address.
   * @returns User or `null`.
   */
  getUserByEmail(tenantId: string, email: string): MaybePromise<StoredUser | null>
  /**
   * Verifies a password against the user's stored hash.
   *
   * @param user - Stored user.
   * @param password - Candidate plaintext.
   * @returns Whether the password matches.
   */
  verifyPassword(user: StoredUser, password: string): MaybePromise<boolean>
  /**
   * Updates mutable user fields.
   *
   * @param userId - User id.
   * @param updates - Partial updates (`name`).
   * @returns Updated user or `null` when missing.
   */
  updateUser(userId: string, updates: { name?: string | null }): MaybePromise<StoredUser | null>
  /**
   * Changes a password after verifying the old one.
   *
   * @param userId - User id.
   * @param oldPassword - Current password.
   * @param newPassword - Replacement password.
   * @returns `true` on success; `false` when user missing or old password wrong.
   */
  changePassword(userId: string, oldPassword: string, newPassword: string): MaybePromise<boolean>
  /**
   * Creates an API access token and returns plaintext once.
   *
   * @param userId - Owning user.
   * @param tenantId - Tenant scope.
   * @param name - Token label.
   * @param scopes - Granted scopes.
   * @param expiresAt - Optional expiry.
   * @returns Record plus plaintext token.
   */
  createAccessToken(
    userId: string,
    tenantId: string,
    name: string,
    scopes: string[],
    expiresAt?: Date | null,
  ): MaybePromise<CreatedAccessToken>
  /**
   * Looks up a token by record id.
   *
   * @param tokenId - Token id.
   * @returns Token or `null`.
   */
  getAccessToken(tokenId: string): MaybePromise<StoredAccessToken | null>
  /**
   * Looks up an active, non-expired token by plaintext value.
   *
   * @param tokenValue - Plaintext API token.
   * @returns Token or `null`.
   */
  getAccessTokenByValue(tokenValue: string): MaybePromise<StoredAccessToken | null>
  /**
   * Lists tokens for a user (hashes only).
   *
   * @param userId - User id.
   * @returns Token records.
   */
  listUserTokens(userId: string): MaybePromise<StoredAccessToken[]>
  /**
   * Soft-revokes a token.
   *
   * @param tokenId - Token id.
   * @returns Whether a token was updated.
   */
  revokeToken(tokenId: string): MaybePromise<boolean>
  /**
   * Creates a tenant rule.
   *
   * @param tenantId - Tenant scope.
   * @param name - Rule name.
   * @param description - Optional description.
   * @param condition - Condition expression.
   * @param action - Action expression.
   * @param priority - Priority; defaults to 0.
   * @returns Created rule.
   */
  createRule(
    tenantId: string,
    name: string,
    description: string | null,
    condition: string,
    action: string,
    priority?: number,
  ): MaybePromise<StoredRule>
  /**
   * Looks up a rule by id.
   *
   * @param ruleId - Rule id.
   * @returns Rule or `null`.
   */
  getRule(ruleId: string): MaybePromise<StoredRule | null>
  /**
   * Lists rules for a tenant.
   *
   * @param tenantId - Tenant scope.
   * @returns Rules.
   */
  listTenantRules(tenantId: string): MaybePromise<StoredRule[]>
  /**
   * Updates a rule.
   *
   * @param ruleId - Rule id.
   * @param updates - Partial field updates.
   * @returns Updated rule or `null`.
   */
  updateRule(
    ruleId: string,
    updates: {
      name?: string
      description?: string | null
      condition?: string
      action?: string
      priority?: number
      isActive?: boolean
    },
  ): MaybePromise<StoredRule | null>
  /**
   * Deletes a rule.
   *
   * @param ruleId - Rule id.
   * @returns Whether a rule was deleted.
   */
  deleteRule(ruleId: string): MaybePromise<boolean>
}

/**
 * Process-local user/token/rule store for tests and non-Postgres deployments.
 */
export class InMemoryUserService implements UserService {
  private users = new Map<string, StoredUser>()
  private accessTokens = new Map<string, StoredAccessToken>()
  private tokensByUser = new Map<string, string[]>()
  private rules = new Map<string, StoredRule>()
  private usersByEmail = new Map<string, StoredUser>()

  /**
   * @param email - Email address.
   * @param password - Plaintext password.
   * @param name - Display name.
   * @param tenantId - Tenant scope.
   * @param role - Role; defaults to MEMBER.
   * @returns Created user.
   * @throws Error When the email already exists in the tenant.
   */
  createUser(
    email: string,
    password: string,
    name: string | null,
    tenantId: string,
    role: "ADMIN" | "MEMBER" = "MEMBER",
  ): StoredUser {
    const existingUser = this.usersByEmail.get(
      `${tenantId}:${email.toLowerCase()}`,
    )
    if (existingUser) {
      throw new Error("User already exists")
    }

    const userId = "user_" + randomBytes(12).toString("hex")
    const user: StoredUser = {
      id: userId,
      tenantId,
      email,
      name,
      passwordHash: hashPassword(password),
      role,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.users.set(userId, user)
    this.usersByEmail.set(`${tenantId}:${email.toLowerCase()}`, user)
    this.tokensByUser.set(userId, [])

    return user
  }

  /**
   * @param userId - User id.
   * @returns User or `null`.
   */
  getUserById(userId: string): StoredUser | null {
    return this.users.get(userId) ?? null
  }

  /**
   * @param tenantId - Tenant scope.
   * @param email - Email address.
   * @returns User or `null`.
   */
  getUserByEmail(tenantId: string, email: string): StoredUser | null {
    return (
      this.usersByEmail.get(`${tenantId}:${email.toLowerCase()}`) ?? null
    )
  }

  /**
   * @param user - Stored user.
   * @param password - Candidate plaintext.
   * @returns Whether the password matches.
   */
  verifyPassword(user: StoredUser, password: string): boolean {
    return verifyPasswordHash(user.passwordHash, password)
  }

  /**
   * @param userId - User id.
   * @param updates - Partial updates.
   * @returns Updated user or `null`.
   */
  updateUser(
    userId: string,
    updates: { name?: string | null },
  ): StoredUser | null {
    const user = this.users.get(userId)
    if (!user) return null

    if (updates.name !== undefined) {
      user.name = updates.name
    }
    user.updatedAt = new Date()

    return user
  }

  /**
   * @param userId - User id.
   * @param oldPassword - Current password.
   * @param newPassword - Replacement password.
   * @returns Whether the password was changed.
   */
  changePassword(userId: string, oldPassword: string, newPassword: string): boolean {
    const user = this.users.get(userId)
    if (!user) return false

    if (!this.verifyPassword(user, oldPassword)) {
      return false
    }

    user.passwordHash = hashPassword(newPassword)
    user.updatedAt = new Date()

    return true
  }

  /**
   * @param userId - Owning user.
   * @param tenantId - Tenant scope.
   * @param name - Token label.
   * @param scopes - Granted scopes.
   * @param expiresAt - Optional expiry.
   * @returns Record plus plaintext token.
   */
  createAccessToken(
    userId: string,
    tenantId: string,
    name: string,
    scopes: string[],
    expiresAt: Date | null = null,
  ): CreatedAccessToken {
    const tokenId = "token_" + randomBytes(12).toString("hex")
    const plaintextToken = generateToken()

    const record: StoredAccessToken = {
      id: tokenId,
      tenantId,
      userId,
      name,
      tokenHash: hashApiToken(plaintextToken),
      scopes,
      isActive: true,
      expiresAt,
      lastUsedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.accessTokens.set(tokenId, record)
    const userTokens = this.tokensByUser.get(userId) ?? []
    userTokens.push(tokenId)
    this.tokensByUser.set(userId, userTokens)

    return { record, plaintextToken }
  }

  /**
   * @param tokenId - Token id.
   * @returns Token or `null`.
   */
  getAccessToken(tokenId: string): StoredAccessToken | null {
    return this.accessTokens.get(tokenId) ?? null
  }

  /**
   * @param tokenValue - Plaintext API token.
   * @returns Matching active token, updating `lastUsedAt`, or `null`.
   */
  getAccessTokenByValue(tokenValue: string): StoredAccessToken | null {
    for (const token of this.accessTokens.values()) {
      if (
        token.isActive &&
        apiTokensEqual(token.tokenHash, tokenValue) &&
        (!token.expiresAt || token.expiresAt.getTime() >= Date.now())
      ) {
        token.lastUsedAt = new Date()
        return token
      }
    }
    return null
  }

  /**
   * @param userId - User id.
   * @returns Token records for the user.
   */
  listUserTokens(userId: string): StoredAccessToken[] {
    const tokenIds = this.tokensByUser.get(userId) ?? []
    return tokenIds
      .map((id) => this.accessTokens.get(id))
      .filter((t) => t !== undefined) as StoredAccessToken[]
  }

  /**
   * @param tokenId - Token id.
   * @returns Whether the token was soft-revoked.
   */
  revokeToken(tokenId: string): boolean {
    const token = this.accessTokens.get(tokenId)
    if (!token) return false

    token.isActive = false
    token.updatedAt = new Date()

    return true
  }

  /**
   * @param tenantId - Tenant scope.
   * @param name - Rule name.
   * @param description - Optional description.
   * @param condition - Condition expression.
   * @param action - Action expression.
   * @param priority - Priority; defaults to 0.
   * @returns Created rule.
   */
  createRule(
    tenantId: string,
    name: string,
    description: string | null,
    condition: string,
    action: string,
    priority: number = 0,
  ): StoredRule {
    const ruleId = "rule_" + randomBytes(12).toString("hex")

    const rule: StoredRule = {
      id: ruleId,
      tenantId,
      name,
      description,
      condition,
      action,
      isActive: true,
      priority,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.rules.set(ruleId, rule)

    return rule
  }

  /**
   * @param ruleId - Rule id.
   * @returns Rule or `null`.
   */
  getRule(ruleId: string): StoredRule | null {
    return this.rules.get(ruleId) ?? null
  }

  /**
   * @param tenantId - Tenant scope.
   * @returns Rules for the tenant.
   */
  listTenantRules(tenantId: string): StoredRule[] {
    return Array.from(this.rules.values()).filter(
      (rule) => rule.tenantId === tenantId,
    )
  }

  /**
   * @param ruleId - Rule id.
   * @param updates - Partial field updates.
   * @returns Updated rule or `null`.
   */
  updateRule(
    ruleId: string,
    updates: {
      name?: string
      description?: string | null
      condition?: string
      action?: string
      priority?: number
      isActive?: boolean
    },
  ): StoredRule | null {
    const rule = this.rules.get(ruleId)
    if (!rule) return null

    if (updates.name !== undefined) rule.name = updates.name
    if (updates.description !== undefined) rule.description = updates.description
    if (updates.condition !== undefined) rule.condition = updates.condition
    if (updates.action !== undefined) rule.action = updates.action
    if (updates.priority !== undefined) rule.priority = updates.priority
    if (updates.isActive !== undefined) rule.isActive = updates.isActive

    rule.updatedAt = new Date()

    return rule
  }

  /**
   * @param ruleId - Rule id.
   * @returns Whether the rule was deleted.
   */
  deleteRule(ruleId: string): boolean {
    return this.rules.delete(ruleId)
  }
}
