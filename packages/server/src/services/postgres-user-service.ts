/**
 * Postgres-backed {@link UserService} for users, API tokens, and rules.
 */

import { randomBytes } from "node:crypto"

import type { Pool } from "pg"

import {
  type CreatedAccessToken,
  hashApiToken,
  hashPassword,
  type StoredAccessToken,
  type StoredRule,
  type StoredUser,
  type UserService,
  verifyPasswordHash,
} from "./user-service.js"

/**
 * {@link UserService} implementation using `limetry_users`,
 * `limetry_access_tokens`, and `limetry_rules`.
 */
export class PostgresUserService implements UserService {
  /**
   * @param pool - Shared `pg` pool.
   */
  constructor(private readonly pool: Pool) {}

  /**
   * Inserts a new user row.
   *
   * @param email - Email (stored lowercased).
   * @param password - Plaintext password.
   * @param name - Display name.
   * @param tenantId - Tenant scope.
   * @param role - Role; defaults to MEMBER.
   * @returns Created user.
   * @throws When the unique `(tenant_id, email)` constraint is violated.
   */
  async createUser(
    email: string,
    password: string,
    name: string | null,
    tenantId: string,
    role: "ADMIN" | "MEMBER" = "MEMBER",
  ): Promise<StoredUser> {
    const result = await this.pool.query<UserRow>(
      `INSERT INTO limetry_users (
         id, tenant_id, email, name, password_hash, role, is_active,
         created_at, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, TRUE, NOW(), NOW())
       RETURNING *`,
      [
        `user_${randomBytes(12).toString("hex")}`,
        tenantId,
        email.toLowerCase(),
        name,
        hashPassword(password),
        role,
      ],
    )
    return mapUser(result.rows[0]!)
  }

  /**
   * @param userId - User id.
   * @returns User or `null`.
   * @throws When the SQL select fails.
   */
  async getUserById(userId: string): Promise<StoredUser | null> {
    const result = await this.pool.query<UserRow>(
      "SELECT * FROM limetry_users WHERE id = $1",
      [userId],
    )
    return result.rows[0] ? mapUser(result.rows[0]) : null
  }

  /**
   * @param tenantId - Tenant scope.
   * @param email - Email (compared lowercased).
   * @returns User or `null`.
   * @throws When the SQL select fails.
   */
  async getUserByEmail(tenantId: string, email: string): Promise<StoredUser | null> {
    const result = await this.pool.query<UserRow>(
      "SELECT * FROM limetry_users WHERE tenant_id = $1 AND email = $2",
      [tenantId, email.toLowerCase()],
    )
    return result.rows[0] ? mapUser(result.rows[0]) : null
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
   * @param updates - Partial updates (`name`).
   * @returns Updated user or `null`.
   * @throws When the SQL update fails.
   */
  async updateUser(
    userId: string,
    updates: { name?: string | null },
  ): Promise<StoredUser | null> {
    if (updates.name === undefined) {
      return this.getUserById(userId)
    }
    const result = await this.pool.query<UserRow>(
      `UPDATE limetry_users
       SET name = $2, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [userId, updates.name],
    )
    return result.rows[0] ? mapUser(result.rows[0]) : null
  }

  /**
   * @param userId - User id.
   * @param oldPassword - Current password.
   * @param newPassword - Replacement password.
   * @returns Whether the password was changed.
   * @throws When the SQL update fails after verification.
   */
  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<boolean> {
    const user = await this.getUserById(userId)
    if (!user || !this.verifyPassword(user, oldPassword)) {
      return false
    }
    await this.pool.query(
      `UPDATE limetry_users
       SET password_hash = $2, updated_at = NOW()
       WHERE id = $1`,
      [userId, hashPassword(newPassword)],
    )
    return true
  }

  /**
   * @param userId - Owning user.
   * @param tenantId - Tenant scope.
   * @param name - Token label.
   * @param scopes - Granted scopes.
   * @param expiresAt - Optional expiry.
   * @returns Record plus plaintext token.
   * @throws When the SQL insert fails.
   */
  async createAccessToken(
    userId: string,
    tenantId: string,
    name: string,
    scopes: string[],
    expiresAt: Date | null = null,
  ): Promise<CreatedAccessToken> {
    const plaintextToken = `limetry_${randomBytes(24).toString("hex")}`
    const result = await this.pool.query<TokenRow>(
      `INSERT INTO limetry_access_tokens (
         id, tenant_id, user_id, name, token, scopes, is_active,
         expires_at, created_at, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, TRUE, $7, NOW(), NOW())
       RETURNING *`,
      [
        `token_${randomBytes(12).toString("hex")}`,
        tenantId,
        userId,
        name,
        hashApiToken(plaintextToken),
        JSON.stringify(scopes),
        expiresAt,
      ],
    )
    return { record: mapToken(result.rows[0]!), plaintextToken }
  }

  /**
   * @param tokenId - Token id.
   * @returns Token or `null`.
   * @throws When the SQL select fails.
   */
  async getAccessToken(tokenId: string): Promise<StoredAccessToken | null> {
    const result = await this.pool.query<TokenRow>(
      "SELECT * FROM limetry_access_tokens WHERE id = $1",
      [tokenId],
    )
    return result.rows[0] ? mapToken(result.rows[0]) : null
  }

  /**
   * Looks up by hashed plaintext and bumps `last_used_at` on hit.
   *
   * @param tokenValue - Plaintext API token.
   * @returns Active non-expired token or `null`.
   * @throws When SQL fails.
   */
  async getAccessTokenByValue(tokenValue: string): Promise<StoredAccessToken | null> {
    const result = await this.pool.query<TokenRow>(
      `SELECT * FROM limetry_access_tokens
       WHERE token = $1 AND is_active = TRUE
         AND (expires_at IS NULL OR expires_at >= NOW())`,
      [hashApiToken(tokenValue)],
    )
    const token = result.rows[0] ? mapToken(result.rows[0]) : null
    if (token) {
      await this.pool.query(
        "UPDATE limetry_access_tokens SET last_used_at = NOW() WHERE id = $1",
        [token.id],
      )
    }
    return token
  }

  /**
   * @param userId - User id.
   * @returns Tokens newest-first.
   * @throws When the SQL select fails.
   */
  async listUserTokens(userId: string): Promise<StoredAccessToken[]> {
    const result = await this.pool.query<TokenRow>(
      `SELECT * FROM limetry_access_tokens
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId],
    )
    return result.rows.map(mapToken)
  }

  /**
   * Soft-revokes a token by setting `is_active = FALSE`.
   *
   * @param tokenId - Token id.
   * @returns Whether a row was updated.
   * @throws When the SQL update fails.
   */
  async revokeToken(tokenId: string): Promise<boolean> {
    const result = await this.pool.query(
      `UPDATE limetry_access_tokens
       SET is_active = FALSE, updated_at = NOW()
       WHERE id = $1`,
      [tokenId],
    )
    return (result.rowCount ?? 0) > 0
  }

  /**
   * @param tenantId - Tenant scope.
   * @param name - Rule name.
   * @param description - Optional description.
   * @param condition - Condition expression.
   * @param action - Action expression.
   * @param priority - Priority; defaults to 0.
   * @returns Created rule.
   * @throws When the SQL insert fails.
   */
  async createRule(
    tenantId: string,
    name: string,
    description: string | null,
    condition: string,
    action: string,
    priority = 0,
  ): Promise<StoredRule> {
    const result = await this.pool.query<RuleRow>(
      `INSERT INTO limetry_rules (
         id, tenant_id, name, description, condition, action,
         is_active, priority, created_at, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, TRUE, $7, NOW(), NOW())
       RETURNING *`,
      [
        `rule_${randomBytes(12).toString("hex")}`,
        tenantId,
        name,
        description,
        condition,
        action,
        priority,
      ],
    )
    return mapRule(result.rows[0]!)
  }

  /**
   * @param ruleId - Rule id.
   * @returns Rule or `null`.
   * @throws When the SQL select fails.
   */
  async getRule(ruleId: string): Promise<StoredRule | null> {
    const result = await this.pool.query<RuleRow>(
      "SELECT * FROM limetry_rules WHERE id = $1",
      [ruleId],
    )
    return result.rows[0] ? mapRule(result.rows[0]) : null
  }

  /**
   * @param tenantId - Tenant scope.
   * @returns Rules ordered by priority desc, then created_at asc.
   * @throws When the SQL select fails.
   */
  async listTenantRules(tenantId: string): Promise<StoredRule[]> {
    const result = await this.pool.query<RuleRow>(
      `SELECT * FROM limetry_rules
       WHERE tenant_id = $1
       ORDER BY priority DESC, created_at ASC`,
      [tenantId],
    )
    return result.rows.map(mapRule)
  }

  /**
   * @param ruleId - Rule id.
   * @param updates - Partial field updates.
   * @returns Updated rule or `null` when missing.
   * @throws When the SQL update fails.
   */
  async updateRule(
    ruleId: string,
    updates: {
      name?: string
      description?: string | null
      condition?: string
      action?: string
      priority?: number
      isActive?: boolean
    },
  ): Promise<StoredRule | null> {
    const existing = await this.getRule(ruleId)
    if (!existing) {
      return null
    }
    const result = await this.pool.query<RuleRow>(
      `UPDATE limetry_rules
       SET name = $2, description = $3, condition = $4, action = $5,
           priority = $6, is_active = $7, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [
        ruleId,
        updates.name ?? existing.name,
        updates.description === undefined ? existing.description : updates.description,
        updates.condition ?? existing.condition,
        updates.action ?? existing.action,
        updates.priority ?? existing.priority,
        updates.isActive ?? existing.isActive,
      ],
    )
    return result.rows[0] ? mapRule(result.rows[0]) : null
  }

  /**
   * @param ruleId - Rule id.
   * @returns Whether a row was deleted.
   * @throws When the SQL delete fails.
   */
  async deleteRule(ruleId: string): Promise<boolean> {
    const result = await this.pool.query(
      "DELETE FROM limetry_rules WHERE id = $1",
      [ruleId],
    )
    return (result.rowCount ?? 0) > 0
  }
}

/**
 * Raw `limetry_users` row shape.
 */
type UserRow = {
  id: string
  tenant_id: string
  email: string
  name: string | null
  password_hash: string
  role: "ADMIN" | "MEMBER"
  is_active: boolean
  created_at: Date
  updated_at: Date
}

/**
 * Raw `limetry_access_tokens` row shape.
 */
type TokenRow = {
  id: string
  tenant_id: string
  user_id: string
  name: string
  token: string
  scopes: string[]
  is_active: boolean
  expires_at: Date | null
  last_used_at: Date | null
  created_at: Date
  updated_at: Date
}

/**
 * Raw `limetry_rules` row shape.
 */
type RuleRow = {
  id: string
  tenant_id: string
  name: string
  description: string | null
  condition: string
  action: string
  is_active: boolean
  priority: number
  created_at: Date
  updated_at: Date
}

/**
 * Maps a user row to {@link StoredUser}.
 *
 * @param row - Database row.
 * @returns Domain user.
 */
function mapUser(row: UserRow): StoredUser {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    email: row.email,
    name: row.name,
    passwordHash: row.password_hash,
    role: row.role,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * Maps a token row to {@link StoredAccessToken}.
 *
 * @param row - Database row.
 * @returns Domain token (hash in `tokenHash`).
 */
function mapToken(row: TokenRow): StoredAccessToken {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    userId: row.user_id,
    name: row.name,
    tokenHash: row.token,
    scopes: row.scopes,
    isActive: row.is_active,
    expiresAt: row.expires_at,
    lastUsedAt: row.last_used_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * Maps a rule row to {@link StoredRule}.
 *
 * @param row - Database row.
 * @returns Domain rule.
 */
function mapRule(row: RuleRow): StoredRule {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    description: row.description,
    condition: row.condition,
    action: row.action,
    isActive: row.is_active,
    priority: row.priority,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
