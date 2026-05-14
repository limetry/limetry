/**
 * JWT jti revocation stores for logout (in-memory and Redis).
 */

import type { Redis } from "ioredis"

/**
 * Port for revoking and checking JWT ids until their natural expiry.
 */
export type JwtRevocationStore = {
  /**
   * Marks a jti as revoked until `expiresAtMs`.
   *
   * @param jti - JWT id claim.
   * @param expiresAtMs - Epoch ms when the revocation entry may expire.
   * @returns Nothing.
   */
  revoke(jti: string, expiresAtMs: number): Promise<void>
  /**
   * Returns whether the jti is currently revoked.
   *
   * @param jti - JWT id claim.
   * @returns `true` when revoked and not yet expired.
   */
  isRevoked(jti: string): Promise<boolean>
}

/**
 * Process-local JWT revocation map.
 */
export class InMemoryJwtRevocationStore implements JwtRevocationStore {
  private readonly revoked = new Map<string, number>()

  /**
   * @param jti - JWT id.
   * @param expiresAtMs - Expiry epoch ms.
   * @returns Nothing.
   */
  async revoke(jti: string, expiresAtMs: number): Promise<void> {
    this.revoked.set(jti, expiresAtMs)
  }

  /**
   * @param jti - JWT id.
   * @returns Whether the jti is revoked; expired entries are deleted.
   */
  async isRevoked(jti: string): Promise<boolean> {
    const expiresAt = this.revoked.get(jti)
    if (!expiresAt) {
      return false
    }
    if (expiresAt < Date.now()) {
      this.revoked.delete(jti)
      return false
    }
    return true
  }
}

/**
 * Redis-backed JWT revocation using PX TTL keys.
 */
export class RedisJwtRevocationStore implements JwtRevocationStore {
  /**
   * @param redis - ioredis client.
   */
  constructor(private readonly redis: Redis) {}

  /**
   * Sets `limetry:jwt:revoked:{jti}` with a millisecond TTL.
   *
   * @param jti - JWT id.
   * @param expiresAtMs - Absolute expiry epoch ms.
   * @returns Nothing.
   * @throws When Redis SET fails.
   */
  async revoke(jti: string, expiresAtMs: number): Promise<void> {
    const ttlMs = Math.max(1, expiresAtMs - Date.now())
    await this.redis.set(`limetry:jwt:revoked:${jti}`, "1", "PX", ttlMs)
  }

  /**
   * @param jti - JWT id.
   * @returns Whether the Redis key is present.
   * @throws When Redis GET fails.
   */
  async isRevoked(jti: string): Promise<boolean> {
    const value = await this.redis.get(`limetry:jwt:revoked:${jti}`)
    return value === "1"
  }
}
