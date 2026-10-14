/**
 * Loopback-only CLI setup: a person at this machine confirms in the browser,
 * then the server mints a scoped API token for `limetry setup`.
 *
 * Disabled in production so a public API cannot mint credentials.
 */

import { randomBytes } from "node:crypto"

import express, { type Request, type Response, type Router } from "express"

import { ADMIN_SCOPES } from "../middleware/bearer-auth.js"
import type { UserService } from "../services/user-service.js"

const LOCAL_CLI_EMAIL = "cli-local@localhost"
const CODE_TTL_MS = 2 * 60 * 1000

type PendingCode = {
  token: string
  expiresAt: number
}

const pendingCodes = new Map<string, PendingCode>()

/**
 * Returns whether the TCP peer is this machine.
 *
 * @param request - Incoming HTTP request.
 * @returns `true` for IPv4 and IPv6 loopback peers.
 */
export function isLoopbackRequest(request: Request): boolean {
  const address = request.socket.remoteAddress ?? ""
  return address === "127.0.0.1"
    || address === "::1"
    || address === "::ffff:127.0.0.1"
}

/**
 * Returns whether a CLI callback URL stays on this machine.
 *
 * @param value - Candidate redirect URI.
 * @returns `true` for http loopback URLs.
 */
export function isLoopbackRedirect(value: string): boolean {
  try {
    const url = new URL(value)
    const host = url.hostname
    return url.protocol === "http:"
      && (host === "127.0.0.1" || host === "localhost" || host === "[::1]")
  } catch {
    return false
  }
}

/**
 * Registers the local CLI setup page and one-time token exchange.
 *
 * @param router - Express app.
 * @param userService - Store that owns the minted token.
 * @returns Nothing.
 */
export function createCliSetupRoutes(
  router: Router,
  userService: UserService,
): void {
  router.get("/cli/setup", (request, response) => {
    if (!allowLocalSetup(request, response)) {
      return
    }
    const redirectUri = String(request.query.redirect_uri ?? "")
    const state = String(request.query.state ?? "")
    if (!isLoopbackRedirect(redirectUri) || !state) {
      response.status(400).type("html").send("<p>Missing a local CLI callback.</p>")
      return
    }
    response.type("html").send(renderSetupPage(redirectUri, state))
  })

  router.post("/v1/setup/cli-token", express.urlencoded({ extended: false }), async (request, response) => {
    if (!allowLocalSetup(request, response)) {
      return
    }
    const redirectUri = String(request.body?.redirectUri ?? request.body?.redirect_uri ?? "")
    const state = String(request.body?.state ?? "")
    if (!isLoopbackRedirect(redirectUri) || !state) {
      response.status(400).json({ error: "A local CLI callback is required" })
      return
    }
    const token = await mintLocalCliToken(userService)
    const code = randomBytes(24).toString("base64url")
    pendingCodes.set(code, { token, expiresAt: Date.now() + CODE_TTL_MS })
    const target = new URL(redirectUri)
    target.searchParams.set("code", code)
    target.searchParams.set("state", state)
    response.redirect(303, target.toString())
  })

  router.post("/v1/setup/cli-token/exchange", (request, response) => {
    if (!allowLocalSetup(request, response)) {
      return
    }
    const code = String(request.body?.code ?? "")
    const pending = pendingCodes.get(code)
    pendingCodes.delete(code)
    if (!pending || pending.expiresAt < Date.now()) {
      response.status(401).json({ error: "Setup code expired" })
      return
    }
    response.status(200).json({ token: pending.token })
  })
}

/**
 * Refuses the setup routes outside local development.
 *
 * @param env - Server environment.
 * @param request - Incoming request.
 * @param response - HTTP response.
 * @returns `true` when the request may continue.
 */
function allowLocalSetup(request: Request, response: Response): boolean {
  if (process.env.NODE_ENV === "production" || !isLoopbackRequest(request)) {
    response.status(404).json({ error: "Not found" })
    return false
  }
  return true
}

/**
 * Creates or reuses the local CLI user and returns a new plaintext token.
 *
 * @param userService - Token store.
 * @returns Plaintext API token.
 */
async function mintLocalCliToken(userService: UserService): Promise<string> {
  const existing = await userService.getUserByEmail("default", LOCAL_CLI_EMAIL)
  const user = existing ?? await userService.createUser(
    LOCAL_CLI_EMAIL,
    randomBytes(24).toString("base64url"),
    "Local CLI",
    "default",
    "ADMIN",
  )
  const created = await userService.createAccessToken(
    user.id,
    user.tenantId,
    "limetry setup",
    [...ADMIN_SCOPES],
    null,
  )
  return created.plaintextToken
}

/**
 * Renders the confirm page. Values are escaped before interpolation.
 *
 * @param redirectUri - CLI loopback callback.
 * @param state - CSRF state from the CLI.
 * @returns HTML document.
 */
function renderSetupPage(redirectUri: string, state: string): string {
  const redirect = escapeHtml(redirectUri)
  const setupState = escapeHtml(state)
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Limetry CLI setup</title></head>
<body>
  <h1>Create a CLI token</h1>
  <p>This confirms someone at this computer is setting up the Limetry CLI.</p>
  <form method="post" action="/v1/setup/cli-token">
    <input type="hidden" name="redirect_uri" value="${redirect}">
    <input type="hidden" name="state" value="${setupState}">
    <button type="submit">Create CLI token</button>
  </form>
</body>
</html>`
}

/**
 * Escapes text for an HTML attribute.
 *
 * @param value - Raw text.
 * @returns Escaped text.
 */
function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("\"", "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
}
