/**
 * In-process rolling-window request throttle for per-app rate limits.
 */

/**
 * Tracks request timestamps per app id within a one-minute window.
 */
export class ThrottleStore {
  private readonly maxRequestsPerMinute: number
  private readonly requestTimestampsByAppId = new Map<string, number[]>()

  /**
   * @param maxRequestsPerMinute - Maximum allowed requests in any rolling 60s window.
   */
  constructor(maxRequestsPerMinute: number) {
    this.maxRequestsPerMinute = maxRequestsPerMinute
  }

  /**
   * Throws when the app has already hit the per-minute cap.
   *
   * @param appId - Application / agent identifier.
   * @param observedAt - Observation time in epoch ms; defaults to now.
   * @returns Nothing.
   * @throws {@link ThrottleExceededError} when the limit is reached.
   */
  assertAllowed(appId: string, observedAt: number = Date.now()): void {
    const recentTimestamps = this.prune(appId, observedAt)

    if (recentTimestamps.length >= this.maxRequestsPerMinute) {
      throw new ThrottleExceededError(appId, recentTimestamps.length)
    }
  }

  /**
   * Records a request timestamp after a successful allow check.
   *
   * @param appId - Application / agent identifier.
   * @param observedAt - Observation time in epoch ms; defaults to now.
   * @returns Nothing.
   */
  recordRequest(appId: string, observedAt: number = Date.now()): void {
    const recentTimestamps = this.prune(appId, observedAt)
    recentTimestamps.push(observedAt)
    this.requestTimestampsByAppId.set(appId, recentTimestamps)
  }

  /**
   * Counts recent requests in the current one-minute window.
   *
   * @param appId - Application / agent identifier.
   * @param observedAt - Observation time in epoch ms; defaults to now.
   * @returns Number of timestamps still inside the window.
   */
  countRecentRequests(appId: string, observedAt: number = Date.now()): number {
    return this.prune(appId, observedAt).length
  }

  /**
   * Drops timestamps older than 60 seconds and returns the remainder.
   *
   * @param appId - Application / agent identifier.
   * @param observedAt - Observation time in epoch ms.
   * @returns Pruned timestamp list for the app.
   */
  private prune(appId: string, observedAt: number): number[] {
    const windowStart = observedAt - 60_000
    const existing = this.requestTimestampsByAppId.get(appId) ?? []
    const pruned = existing.filter((timestamp) => timestamp >= windowStart)

    if (pruned.length === 0) {
      this.requestTimestampsByAppId.delete(appId)
    } else {
      this.requestTimestampsByAppId.set(appId, pruned)
    }

    return pruned
  }
}

/**
 * Duck-typed throttle interface shared by in-memory and Redis stores.
 */
export type ThrottleStoreLike = {
  /**
   * Asserts the app is under the rate limit.
   *
   * @param appId - Application id.
   * @param observedAt - Optional observation time.
   * @returns Nothing (sync or async).
   * @throws {@link ThrottleExceededError} when over limit.
   */
  assertAllowed(appId: string, observedAt?: number): void | Promise<void>
  /**
   * Records a request (no-op for Redis when claim happens in assertAllowed).
   *
   * @param appId - Application id.
   * @param observedAt - Optional observation time.
   * @returns Nothing (sync or async).
   */
  recordRequest(appId: string, observedAt?: number): void | Promise<void>
  /**
   * Counts recent requests in the rolling window.
   *
   * @param appId - Application id.
   * @param observedAt - Optional observation time.
   * @returns Count (sync or async).
   */
  countRecentRequests(appId: string, observedAt?: number): number | Promise<number>
}

/**
 * Error thrown when a throttle window is exhausted.
 */
export class ThrottleExceededError extends Error {
  /**
   * App id that exceeded the limit.
   */
  readonly appId: string
  /**
   * Observed request count at failure time.
   */
  readonly observedCount: number

  /**
   * @param appId - App that exceeded the limit.
   * @param observedCount - Current window count.
   */
  constructor(appId: string, observedCount: number) {
    super(`Throttle exceeded for appId ${appId}`)
    this.name = "ThrottleExceededError"
    this.appId = appId
    this.observedCount = observedCount
  }
}
