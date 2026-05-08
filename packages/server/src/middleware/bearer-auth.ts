/**
 * Bearer API-token authentication and scope gating for `\@limetry/server`.
 *
 * Accepts the static `LIMETRY_BEARER_TOKEN` (full admin scopes) or a hashed
 * access token from {@link UserService}.
 */

import { timingSafeEqual } from "node:crypto"

import type { NextFunction, Request, Response } from "express"

import type { ServerEnv } from "../env.js"
import type { UserService } from "../services/user-service.js"

/**
 * Constant-time comparison of bearer token strings.
 *
 * @param expected - Configured or stored token value.
 * @param presented - Token from the Authorization header.
 * @returns `true` when both buffers match in length and content.
 */
function bearerTokensEqual(expected: string, presented: string): boolean {
  const left = Buffer.from(expected, "utf8")
  const right = Buffer.from(presented, "utf8")
  if (left.length !== right.length || left.length === 0) {
    return false
  }
  return timingSafeEqual(left, right)
}

/**
 * Full admin scope set granted to the static `LIMETRY_BEARER_TOKEN`.
 */
export const ADMIN_SCOPES = [
  "policies:register",
  "policies:read",
  "policies:write",
  "policy:evaluate",
  "actions:record",
  "audit:read",
  "approvals:read",
  "approvals:write",
  "rules:read",
  "rules:write",
  "metrics:read",
] as const

/**
 * Known admin scope or arbitrary custom scope string on access tokens.
 */
export type BearerScope = (typeof ADMIN_SCOPES)[number] | string

/**
 * Express request with bearer principal attached after successful auth.
 */
export type BearerAuthRequest = Request & {
  /**
   * Authenticated API principal (static admin or user access token).
   */
  bearerPrincipal?: {
    /**
     * Tenant id for policy/audit scoping.
     */
    tenantId: string
    /**
     * User or static-admin id.
     */
    userId: string
    /**
     * Scopes granted to this token.
     */
    scopes: string[]
    /**
     * When true, {@link requireScopes} always passes.
     */
    isStaticAdmin: boolean
  }
}

/**
 * Creates middleware that authenticates `Authorization: Bearer …` tokens.
 *
 * Static `LIMETRY_BEARER_TOKEN` maps to tenant `default` with {@link ADMIN_SCOPES}.
 * Otherwise looks up a hashed access token via `userService`.
 *
 * @param env - Server env containing `LIMETRY_BEARER_TOKEN`.
 * @param userService - Optional user service for access-token lookup.
 * @returns Async Express middleware that responds 401 on failure.
 */
export function createBearerAuthMiddleware(env: ServerEnv, userService?: UserService) {
  return async function bearerAuthMiddleware(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    const authorizationHeader = request.header("authorization")

    if (!authorizationHeader?.startsWith("Bearer ")) {
      response.status(401).json({
        ok: false,
        error: "Missing bearer token",
        code: "unauthorized",
      })
      return
    }

    const token = authorizationHeader.slice("Bearer ".length).trim()

    if (bearerTokensEqual(env.LIMETRY_BEARER_TOKEN, token)) {
      const authenticatedRequest = request as BearerAuthRequest
      authenticatedRequest.bearerPrincipal = {
        tenantId: "default",
        userId: "static-admin",
        scopes: [...ADMIN_SCOPES],
        isStaticAdmin: true,
      }
      next()
      return
    }

    const accessToken = userService
      ? await userService.getAccessTokenByValue(token)
      : null

    if (!accessToken || !accessToken.isActive) {
      response.status(401).json({
        ok: false,
        error: "Invalid bearer token",
        code: "unauthorized",
      })
      return
    }

    const authenticatedRequest = request as BearerAuthRequest
    authenticatedRequest.bearerPrincipal = {
      tenantId: accessToken.tenantId,
      userId: accessToken.userId,
      scopes: accessToken.scopes,
      isStaticAdmin: false,
    }
    next()
  }
}

/**
 * Creates middleware that requires the bearer principal to hold all listed scopes.
 *
 * Static admin principals bypass the check. Missing principal yields 401;
 * missing scopes yield 403 with `insufficient_scope`.
 *
 * @param requiredScopes - Scopes that must all be present.
 * @returns Express middleware.
 */
export function requireScopes(...requiredScopes: string[]) {
  return function requireScopesMiddleware(
    request: Request,
    response: Response,
    next: NextFunction,
  ): void {
    const principal = (request as BearerAuthRequest).bearerPrincipal
    if (!principal) {
      response.status(401).json({
        ok: false,
        error: "Missing bearer principal",
        code: "unauthorized",
      })
      return
    }

    if (principal.isStaticAdmin) {
      next()
      return
    }

    const missing = requiredScopes.filter((scope) => !principal.scopes.includes(scope))
    if (missing.length > 0) {
      response.status(403).json({
        ok: false,
        error: `Missing required scope(s): ${missing.join(", ")}`,
        code: "insufficient_scope",
        missing_scopes: missing,
      })
      return
    }

    next()
  }
}
