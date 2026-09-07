/**
 * Redis connectivity probe (`PING`) via optional peer dependency `ioredis`.
 */

import type { ConnectivityProbe, ProbeResult } from "../types.js"
import { DEFAULT_PROBE_TIMEOUT_MS } from "./http.js"

/**
 * Connects and `PING`s Redis. Requires optional peer `ioredis`.
 *
 * @param url - Redis connection URL.
 * @param timeoutMs - Connect timeout in milliseconds (default {@link DEFAULT_PROBE_TIMEOUT_MS}).
 * @returns Probe result; fails when `ioredis` is missing or ping errors.
 */
export async function probeRedis(
  url: string,
  timeoutMs = DEFAULT_PROBE_TIMEOUT_MS,
): Promise<ProbeResult> {
  const started = Date.now()
  let RedisCtor: typeof import("ioredis").Redis
  try {
    const mod = await import("ioredis")
    RedisCtor = mod.Redis
  } catch {
    return {
      ok: false,
      detail: "Redis connection failed: ioredis is not installed in this process.",
    }
  }
  const redis = new RedisCtor(url, {
    connectTimeout: timeoutMs,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    lazyConnect: true,
  })
  redis.on("error", () => undefined)
  try {
    await redis.connect()
    await redis.ping()
    return {
      ok: true,
      detail: `Redis connected successfully (${Date.now() - started}ms).`,
    }
  } catch (error: unknown) {
    const reason = error instanceof Error ? error.message : "ping failed"
    return {
      ok: false,
      detail: `Redis connection failed (${Date.now() - started}ms): ${reason}`,
    }
  } finally {
    redis.disconnect()
  }
}

/**
 * Wraps {@link probeRedis} as a {@link ConnectivityProbe}.
 *
 * @param input - Connection URL and severity flags.
 * @returns Named `"redis"` connectivity probe.
 */
export function createRedisProbe(input: {
  critical?: boolean
  required: boolean
  timeoutMs?: number
  url: string
}): ConnectivityProbe {
  return {
    name: "redis",
    required: input.required,
    critical: input.critical,
    run: () => probeRedis(input.url, input.timeoutMs),
  }
}
