import { createServer } from "node:net"

import { afterEach, describe, expect, it } from "vitest"

import {
  getAvailablePort,
  isPortInUse,
  resolveAvailablePort,
  resolveDevListenPort,
} from "./ports.js"

const heldServers: ReturnType<typeof createServer>[] = []

async function holdPort(port: number): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const server = createServer()
    server.once("error", reject)
    server.listen(port, "127.0.0.1", () => {
      heldServers.push(server)
      resolve()
    })
  })
}

afterEach(async () => {
  await Promise.all(
    heldServers.splice(0).map(
      (server) =>
        new Promise<void>((resolve, reject) => {
          server.close((err) => {
            if (err) {
              reject(err)
              return
            }
            resolve()
          })
        }),
    ),
  )
})

describe("ports", () => {
  it("detects an occupied port", async () => {
    const preferred = await getAvailablePort(39100)
    await holdPort(preferred)
    expect(await isPortInUse(preferred)).toBe(true)
  })

  it("hops to the next free port when preferred is busy", async () => {
    const preferred = await getAvailablePort(39200)
    await holdPort(preferred)
    const resolved = await resolveAvailablePort(preferred)
    expect(resolved.preferred).toBe(preferred)
    expect(resolved.port).toBeGreaterThan(preferred)
    expect(resolved.changed).toBe(true)
  })

  it("returns preferred unchanged when resolveDevListenPort is disabled", async () => {
    const preferred = await getAvailablePort(39300)
    await holdPort(preferred)
    const resolved = await resolveDevListenPort(preferred, { enabled: false })
    expect(resolved).toEqual({
      preferred,
      port: preferred,
      changed: false,
    })
  })
})
