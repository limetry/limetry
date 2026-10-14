/**
 * Opens the local API setup page and waits for a one-time CLI token.
 */

import { randomBytes } from "node:crypto"
import { createServer, type ServerResponse } from "node:http"

import open from "open"

import { logInfo } from "../../utils/config.js"

const CALLBACK_TIMEOUT_MS = 5 * 60 * 1000

/**
 * Confirms setup in the browser and returns a new API token.
 *
 * @param baseUrl - Loopback API origin.
 * @returns Plaintext bearer token.
 */
export async function createLocalCliToken(baseUrl: string): Promise<string> {
  const state = randomBytes(24).toString("base64url")
  const callback = await startCallbackServer(state)
  const setupUrl = new URL(`${baseUrl.replace(/\/$/, "")}/cli/setup`)
  setupUrl.searchParams.set("redirect_uri", callback.redirectUri)
  setupUrl.searchParams.set("state", state)
  const href = setupUrl.toString()
  logInfo("Opening a browser page on this computer to create a CLI token...")
  logInfo(`If the browser does not open, visit:\n  ${href}`)
  try {
    await open(href)
    const code = await callback.result
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/v1/setup/cli-token/exchange`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    })
    if (!response.ok) {
      throw new Error("The setup code was rejected")
    }
    const body = await response.json() as { token?: string }
    if (!body.token) {
      throw new Error("The API did not return a CLI token")
    }
    return body.token
  } finally {
    await callback.close()
  }
}

/**
 * Listens on loopback for the setup redirect.
 *
 * @param expectedState - State sent to the setup page.
 * @returns Callback URL and a promise for the one-time code.
 */
function startCallbackServer(expectedState: string): Promise<{
  redirectUri: string
  result: Promise<string>
  close: () => Promise<void>
}> {
  return new Promise((resolve, reject) => {
    const server = createServer((request, response) => {
      const url = new URL(request.url ?? "/", "http://127.0.0.1")
      if (url.pathname !== "/oauth/callback") {
        response.writeHead(404)
        response.end()
        return
      }
      const state = url.searchParams.get("state") ?? ""
      const code = url.searchParams.get("code") ?? ""
      if (state !== expectedState || !code) {
        writeHtml(response, 400, "Limetry CLI setup failed")
        return
      }
      writeHtml(response, 200, "Limetry CLI token created. You can close this window.")
      finish(code)
    })
    const timer = setTimeout(() => {
      fail(new Error("Timed out waiting for browser confirmation"))
    }, CALLBACK_TIMEOUT_MS)
    let finish: (code: string) => void = () => undefined
    let fail: (error: Error) => void = () => undefined
    const result = new Promise<string>((resolveResult, rejectResult) => {
      finish = resolveResult
      fail = rejectResult
    })
    server.listen(0, "127.0.0.1", () => {
      const address = server.address()
      if (!address || typeof address === "string") {
        reject(new Error("Could not bind the CLI callback"))
        return
      }
      resolve({
        redirectUri: `http://127.0.0.1:${address.port}/oauth/callback`,
        result,
        close: () => new Promise((closeResolve) => {
          clearTimeout(timer)
          server.close(() => closeResolve())
        }),
      })
    })
    server.on("error", reject)
  })
}

/**
 * Writes a tiny HTML result page.
 *
 * @param response - HTTP response.
 * @param status - Status code.
 * @param message - Visible message.
 * @returns Nothing.
 */
function writeHtml(response: ServerResponse, status: number, message: string): void {
  response.writeHead(status, { "Content-Type": "text/html; charset=utf-8" })
  response.end(`<!doctype html><title>Limetry</title><p>${message}</p>`)
}
