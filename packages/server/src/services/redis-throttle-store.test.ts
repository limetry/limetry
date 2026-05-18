import type { Redis } from "ioredis"
import { describe, expect, it, vi } from "vitest"

import { RedisThrottleStore } from "./redis-throttle-store.js"

describe("RedisThrottleStore", () => {
  it("reserves a throttle slot atomically", async () => {
    const evalCommand = vi.fn().mockResolvedValue(-1)
    const redis = { eval: evalCommand } as unknown as Redis
    const store = new RedisThrottleStore(redis, 5)

    await expect(store.assertAllowed("agent_1", 1_000_000)).resolves.toBeUndefined()
    expect(evalCommand).toHaveBeenCalledOnce()
    expect(String(evalCommand.mock.calls[0]?.[0])).toContain("ZADD")
  })

  it("rejects when the atomic reservation reports the window is full", async () => {
    const redis = { eval: vi.fn().mockResolvedValue(5) } as unknown as Redis
    const store = new RedisThrottleStore(redis, 5)

    await expect(store.assertAllowed("agent_1", 1_000_000)).rejects.toThrow(
      "Throttle exceeded",
    )
  })
})
