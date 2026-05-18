/**
 * Redis-backed rolling-window throttle for multi-instance `\@limetry/server` deployments.
 */

import type { Redis } from "ioredis"

import { ThrottleExceededError } from "./throttle-store.js"

/**
 * Duck-typed throttle interface compatible with {@link ThrottleStore}.
 */
export type ThrottleStoreLike = {
  /**
   * Asserts the app is under the rate limit.
   *
   * @param appId - Application id.
   * @param observedAt - Optional observation time.
   * @returns Nothing.
   * @throws {@link ThrottleExceededError} when over limit.
   */
  assertAllowed(appId: string, observedAt?: number): void | Promise<void>
  /**
   * Records a request (no-op here; reservation happens in assertAllowed).
   *
   * @param appId - Application id.
   * @param observedAt - Optional observation time.
   * @returns Nothing.
   */
  recordRequest(appId: string, observedAt?: number): void | Promise<void>
  /**
   * Counts recent requests in the rolling window.
   *
   * @param appId - Application id.
   * @param observedAt - Optional observation time.
   * @returns Count.
   */
  countRecentRequests(appId: string, observedAt?: number): number | Promise<number>
}

/**
 * Redis-backed rolling-window throttle for multi-instance deployments.
 * Keys: `limetry:throttle:{appId}` as a Redis sorted set of request timestamps.
 */
export class RedisThrottleStore implements ThrottleStoreLike {
  /**
   * @param redis - ioredis client.
   * @param maxRequestsPerMinute - Maximum allowed requests per rolling minute.
   */
  constructor(
    private readonly redis: Redis,
    private readonly maxRequestsPerMinute: number,
  ) {}

  /**
   * Atomically prunes the window, checks the cap, and reserves a slot via Lua.
   *
   * @param appId - Application id.
   * @param observedAt - Observation time in epoch ms; defaults to now.
   * @returns Nothing.
   * @throws {@link ThrottleExceededError} when the window is full.
   * @throws When the Redis eval fails.
   */
  async assertAllowed(appId: string, observedAt: number = Date.now()): Promise<void> {
    const key = this.key(appId)
    const windowStart = observedAt - 60_000
    const member = `${observedAt}:${Math.random().toString(36).slice(2)}`
    const script = `
      redis.call("ZREMRANGEBYSCORE", KEYS[1], 0, ARGV[1])
      local count = redis.call("ZCARD", KEYS[1])
      if count >= tonumber(ARGV[4]) then
        return count
      end
      redis.call("ZADD", KEYS[1], ARGV[2], ARGV[3])
      redis.call("PEXPIRE", KEYS[1], ARGV[5])
      return -1
    `
    const result = Number(await this.redis.eval(
      script,
      1,
      key,
      windowStart,
      observedAt,
      member,
      this.maxRequestsPerMinute,
      120_000,
    ))
    if (result >= 0) {
      throw new ThrottleExceededError(appId, result)
    }
  }

  /**
   * No-op: Redis reserves the throttle slot inside {@link assertAllowed}.
   *
   * @param _appId - Unused application id.
   * @param _observedAt - Unused observation time.
   * @returns Nothing.
   */
  async recordRequest(_appId: string, _observedAt: number = Date.now()): Promise<void> {
  }

  /**
   * Counts members still inside the one-minute window.
   *
   * @param appId - Application id.
   * @param observedAt - Observation time in epoch ms; defaults to now.
   * @returns Sorted-set cardinality after pruning.
   * @throws When Redis commands fail.
   */
  async countRecentRequests(appId: string, observedAt: number = Date.now()): Promise<number> {
    const key = this.key(appId)
    const windowStart = observedAt - 60_000
    await this.redis.zremrangebyscore(key, 0, windowStart)
    return this.redis.zcard(key)
  }

  /**
   * Builds the Redis key for an app throttle window.
   *
   * @param appId - Application id.
   * @returns Redis key string.
   */
  private key(appId: string): string {
    return `limetry:throttle:${appId}`
  }
}
