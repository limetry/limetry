/**
 * Replay-protection nonce claim stores (in-memory and Redis).
 */

import type { Redis } from "ioredis"

/**
 * Port for atomic nonce claim within a TTL window.
 */
export type NonceStore = {
  /**
   * Atomically claims a nonce for the replay window. Returns false when the nonce was already seen.
   *
   * @param nonce - Client-supplied nonce.
   * @param ttlMs - How long the claim remains valid.
   * @returns `true` when newly claimed; `false` on replay.
   */
  claim(nonce: string, ttlMs: number): Promise<boolean>
}

/**
 * Process-local nonce store with lazy expiry pruning.
 */
export class InMemoryNonceStore implements NonceStore {
  private readonly seen = new Map<string, number>()

  /**
   * Claims a nonce if it is absent or expired.
   *
   * @param nonce - Client-supplied nonce.
   * @param ttlMs - Claim TTL in milliseconds.
   * @returns Whether the claim succeeded.
   */
  async claim(nonce: string, ttlMs: number): Promise<boolean> {
    const now = Date.now()
    this.prune(now)

    const expiresAt = this.seen.get(nonce)
    if (expiresAt !== undefined && expiresAt > now) {
      return false
    }

    this.seen.set(nonce, now + ttlMs)
    return true
  }

  /**
   * Removes expired nonce entries.
   *
   * @param now - Current epoch milliseconds.
   * @returns Nothing.
   */
  private prune(now: number): void {
    for (const [key, expiresAt] of this.seen) {
      if (expiresAt <= now) {
        this.seen.delete(key)
      }
    }
  }
}

/**
 * Redis SET NX EX-backed nonce store for multi-instance deployments.
 */
export class RedisNonceStore implements NonceStore {
  /**
   * @param redis - ioredis client.
   * @param keyPrefix - Redis key prefix; defaults to `limetry:nonce:`.
   */
  constructor(private readonly redis: Redis, private readonly keyPrefix = "limetry:nonce:") {}

  /**
   * Claims a nonce via Redis `SET key NX EX`.
   *
   * @param nonce - Client-supplied nonce.
   * @param ttlMs - Claim TTL in milliseconds (rounded up to whole seconds, min 1).
   * @returns Whether Redis accepted the new key.
   * @throws When the Redis command fails.
   */
  async claim(nonce: string, ttlMs: number): Promise<boolean> {
    const ttlSeconds = Math.max(1, Math.ceil(ttlMs / 1000))
    const result = await this.redis.set(
      `${this.keyPrefix}${nonce}`,
      "1",
      "EX",
      ttlSeconds,
      "NX",
    )
    return result === "OK"
  }
}
