import { afterEach, describe, expect, it, vi } from "vitest"

afterEach(() => {
  vi.doUnmock("pg")
  vi.doUnmock("ioredis")
  vi.resetModules()
  vi.restoreAllMocks()
})

describe("postgres probe", () => {
  it("reports a successful SELECT 1", async () => {
    const end = vi.fn(async () => undefined)
    const query = vi.fn(async () => ({ rows: [{ "?column?": 1 }] }))
    vi.doMock("pg", () => ({
      Pool: class {
        query = query
        end = end
      },
    }))
    const { probePostgres } = await import("./probes/postgres.js")
    await expect(probePostgres("postgresql://localhost:5432/appdb")).resolves.toMatchObject({
      ok: true,
      detail: expect.stringContaining("Database connected successfully"),
    })
    expect(query).toHaveBeenCalledWith("SELECT 1")
    expect(end).toHaveBeenCalled()
  })

  it("reports query failures", async () => {
    vi.doMock("pg", () => ({
      Pool: class {
        query = vi.fn(async () => {
          throw new Error("connection refused")
        })
        end = vi.fn(async () => undefined)
      },
    }))
    const { probePostgres } = await import("./probes/postgres.js")
    await expect(probePostgres("postgresql://localhost:5432/appdb")).resolves.toMatchObject({
      ok: false,
      detail: expect.stringContaining("connection refused"),
    })
  })
})

describe("redis probe", () => {
  it("pings redis successfully", async () => {
    const ping = vi.fn(async () => "PONG")
    const connect = vi.fn(async () => undefined)
    const disconnect = vi.fn()
    const on = vi.fn()
    vi.doMock("ioredis", () => ({
      Redis: class {
        ping = ping
        connect = connect
        disconnect = disconnect
        on = on
      },
    }))
    const { probeRedis } = await import("./probes/redis.js")
    await expect(probeRedis("redis://localhost:6379")).resolves.toMatchObject({
      ok: true,
      detail: expect.stringContaining("Redis connected successfully"),
    })
    expect(connect).toHaveBeenCalled()
    expect(ping).toHaveBeenCalled()
    expect(disconnect).toHaveBeenCalled()
  })

  it("reports ping failures", async () => {
    vi.doMock("ioredis", () => ({
      Redis: class {
        ping = vi.fn(async () => {
          throw new Error("NOAUTH")
        })
        connect = vi.fn(async () => undefined)
        disconnect = vi.fn()
        on = vi.fn()
      },
    }))
    const { probeRedis } = await import("./probes/redis.js")
    await expect(probeRedis("redis://localhost:6379")).resolves.toMatchObject({
      ok: false,
      detail: expect.stringContaining("NOAUTH"),
    })
  })
})
