/**
 * Local TCP port availability checks and preferred-port hopping for dev servers.
 */

import net from "node:net"

const CONNECT_HOSTS = ["127.0.0.1", "::1", "localhost"] as const
const CONNECT_TIMEOUT_MS = 150
const DEFAULT_MAX_TRIES = 50

/**
 * Attempts a short TCP connect to detect an accepting listener.
 *
 * @param port - Port to probe.
 * @param host - Host to connect to.
 * @returns `true` when a connection succeeds within the timeout.
 */
function checkPortConnect(port: number, host: string): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket()

    const finish = (inUse: boolean): void => {
      socket.removeAllListeners()
      socket.destroy()
      resolve(inUse)
    }

    socket.setTimeout(CONNECT_TIMEOUT_MS)
    socket.once("connect", () => {
      finish(true)
    })
    socket.once("timeout", () => {
      finish(false)
    })
    socket.once("error", () => {
      finish(false)
    })
    socket.connect(port, host)
  })
}

/**
 * Attempts to bind a temporary server to detect `EADDRINUSE`.
 *
 * @param port - Port to listen on.
 * @param host - Optional bind host; when omitted, binds the default interface.
 * @returns `true` when the port is already in use.
 */
function checkPortListen(port: number, host?: string): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer()
    server.unref()

    server.once("error", (err: NodeJS.ErrnoException) => {
      resolve(err.code === "EADDRINUSE")
    })

    server.once("listening", () => {
      server.close(() => {
        resolve(false)
      })
    })

    if (host) {
      server.listen(port, host)
      return
    }

    server.listen(port)
  })
}

/**
 * Returns true when something is already bound to or accepting connections on the port.
 *
 * @param port - TCP port to inspect on loopback and default interfaces.
 * @returns Whether the port appears occupied.
 */
export async function isPortInUse(port: number): Promise<boolean> {
  for (const host of CONNECT_HOSTS) {
    if (await checkPortConnect(port, host)) {
      return true
    }
  }

  if (await checkPortListen(port, "127.0.0.1")) {
    return true
  }

  if (await checkPortListen(port)) {
    return true
  }

  return false
}

/**
 * Finds the first available port starting from a preferred value.
 *
 * @param preferredPort - First port to try.
 * @param maxTries - Maximum consecutive ports to probe (default 50).
 * @returns The first free port in `[preferredPort, preferredPort + maxTries)`.
 * @throws Error When no free port is found within `maxTries`.
 */
export async function getAvailablePort(
  preferredPort: number,
  maxTries: number = DEFAULT_MAX_TRIES,
): Promise<number> {
  for (let offset = 0; offset < maxTries; offset += 1) {
    const candidate = preferredPort + offset
    if (!(await isPortInUse(candidate))) {
      return candidate
    }
  }

  throw new Error(
    `Could not find an available port after ${maxTries} tries starting from ${preferredPort}`,
  )
}

/**
 * Result of resolving a listen port against occupancy.
 */
export type ResolvedPort = {
  /**
   * Port originally requested by the caller.
   */
  preferred: number
  /**
   * Port that should be used for listening.
   */
  port: number
  /**
   * `true` when `port` differs from `preferred`.
   */
  changed: boolean
}

/**
 * Resolves a listen port, hopping forward when the preferred port is occupied.
 *
 * @param preferredPort - First port to try.
 * @param maxTries - Maximum consecutive ports to probe (default 50).
 * @returns Preferred port, chosen port, and whether they differ.
 * @throws Error When {@link getAvailablePort} cannot find a free port.
 */
export async function resolveAvailablePort(
  preferredPort: number,
  maxTries: number = DEFAULT_MAX_TRIES,
): Promise<ResolvedPort> {
  const port = await getAvailablePort(preferredPort, maxTries)
  return {
    preferred: preferredPort,
    port,
    changed: port !== preferredPort,
  }
}

/**
 * In development, hop off an occupied preferred port. Otherwise return preferred unchanged.
 *
 * @param preferredPort - Configured listen port.
 * @param options - Hop behavior controls.
 * @returns Resolved listen port metadata.
 * @throws Error When hopping is enabled and no free port is found.
 */
export async function resolveDevListenPort(
  preferredPort: number,
  options: {
    enabled?: boolean
    maxTries?: number
  } = {},
): Promise<ResolvedPort> {
  const enabled = options.enabled ?? true
  if (!enabled) {
    return {
      preferred: preferredPort,
      port: preferredPort,
      changed: false,
    }
  }

  return resolveAvailablePort(preferredPort, options.maxTries ?? DEFAULT_MAX_TRIES)
}
