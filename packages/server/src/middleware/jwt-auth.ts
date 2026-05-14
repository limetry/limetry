/**
 * JWT session authentication and dual JWT/bearer middleware for `\@limetry/server`.
 */

import type { NextFunction, Request, Response } from "express"
import jwt from "jsonwebtoken"

import type { ServerEnv } from "../env.js"
import type { JwtRevocationStore } from "../services/jwt-revocation-store.js"
import type { UserService } from "../services/user-service.js"
import { ADMIN_SCOPES, type BearerAuthRequest } from "./bearer-auth.js"

/**
 * Express request with decoded JWT (or dual-auth synthetic) user claims.
 */
export type AuthRequest = Request & {
  /**
   * Authenticated user claims from JWT or API-token bridge.
   */
  user?: {
    /**
     * User id.
     */
    userId: string
    /**
     * Tenant id.
     */
    tenantId: string
    /**
     * User email (synthetic for API tokens).
     */
    email: string
    /**
     * JWT id used for revocation, when present.
     */
    jti?: string
  }
}

/**
 * Creates middleware that verifies a Bearer JWT with `JWT_SECRET` and optional
 * jti revocation.
 *
 * @param env - Server env containing `JWT_SECRET`.
 * @param jwtRevocationStore - Optional revocation store for logout.
 * @returns Async Express middleware responding 401 on failure.
 */
export function jwtAuthMiddleware(env: ServerEnv, jwtRevocationStore?: JwtRevocationStore) {
  return async function jwtAuth(
    request: AuthRequest,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const authHeader = request.headers.authorization

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        response.status(401).json({ error: "Missing authorization header" })
        return
      }

      const token = authHeader.slice(7)

      const decoded = jwt.verify(token, env.JWT_SECRET) as {
        userId: string
        tenantId: string
        email: string
        jti?: string
      }

      if (decoded.jti && jwtRevocationStore && (await jwtRevocationStore.isRevoked(decoded.jti))) {
        response.status(401).json({ error: "Token revoked" })
        return
      }

      request.user = decoded

      next()
    } catch {
      response.status(401).json({ error: "Invalid token" })
    }
  }
}

/**
 * Accepts either a user JWT or a bearer API token with the given scopes.
 * Used by `/v1/rules` so MCP can authenticate with `LIMETRY_API_KEY`.
 *
 * Tries JWT verification first; on failure falls through to static bearer or
 * hashed access-token auth and populates both `user` and `bearerPrincipal`.
 *
 * @param env - Server env for JWT secret and static bearer.
 * @param userService - Access-token lookup.
 * @param requiredScopes - Scopes required for non-admin API tokens.
 * @param jwtRevocationStore - Optional JWT revocation checks.
 * @returns Async Express middleware.
 */
export function createJwtOrBearerAuthMiddleware(
  env: ServerEnv,
  userService: UserService,
  requiredScopes: string[],
  jwtRevocationStore?: JwtRevocationStore,
) {
  return async function jwtOrBearerAuthMiddleware(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    const authHeader = request.headers.authorization
    if (!authHeader?.startsWith("Bearer ")) {
      response.status(401).json({ error: "Missing authorization header" })
      return
    }

    const token = authHeader.slice("Bearer ".length).trim()

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as {
        userId: string
        tenantId: string
        email: string
        jti?: string
      }
      if (decoded.jti && jwtRevocationStore && (await jwtRevocationStore.isRevoked(decoded.jti))) {
        response.status(401).json({ error: "Token revoked" })
        return
      }
      ; (request as AuthRequest).user = decoded
      next()
      return
    } catch {
      /**
       * Fall through to bearer API-token auth.
       */
    }

    if (token === env.LIMETRY_BEARER_TOKEN) {
      ; (request as BearerAuthRequest).bearerPrincipal = {
        tenantId: "default",
        userId: "static-admin",
        scopes: [...ADMIN_SCOPES],
        isStaticAdmin: true,
      }
      ; (request as AuthRequest).user = {
        userId: "static-admin",
        tenantId: "default",
        email: "admin@limetry.local",
      }
      next()
      return
    }

    const accessToken = await userService.getAccessTokenByValue(token)
    if (!accessToken || !accessToken.isActive) {
      response.status(401).json({ error: "Invalid token" })
      return
    }

    const missing = requiredScopes.filter((scope) => !accessToken.scopes.includes(scope))
    if (missing.length > 0) {
      response.status(403).json({
        error: `Missing required scope(s): ${missing.join(", ")}`,
        code: "insufficient_scope",
      })
      return
    }

    ; (request as BearerAuthRequest).bearerPrincipal = {
      tenantId: accessToken.tenantId,
      userId: accessToken.userId,
      scopes: accessToken.scopes,
      isStaticAdmin: false,
    }
    ; (request as AuthRequest).user = {
      userId: accessToken.userId,
      tenantId: accessToken.tenantId,
      email: "api-token@limetry.local",
    }
    next()
  }
}
