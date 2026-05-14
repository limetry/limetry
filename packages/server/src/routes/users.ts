/**
 * Profile and API-token routes for `\@limetry/server` (JWT-authenticated).
 */

import type { Request, Response, Router } from "express"

import type { ServerEnv } from "../env.js"
import { jwtAuthMiddleware } from "../middleware/jwt-auth.js"
import type { JwtRevocationStore } from "../services/jwt-revocation-store.js"
import type { UserService } from "../services/user-service.js"
import type { CreateTokenRequest, TokenResponse, UpdateUserRequest } from "../types.js"

/**
 * Express request with JWT user claims (local alias for route handlers).
 */
export type AuthRequest = Request & {
  /**
   * Authenticated user from {@link jwtAuthMiddleware}.
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
     * User email.
     */
    email: string
  }
}

/**
 * Registers `/v1/profile` and `/v1/tokens` CRUD routes.
 *
 * @param router - Express router or app.
 * @param env - Server env for JWT verification.
 * @param userService - User and token persistence.
 * @param jwtRevocationStore - Optional JWT revocation for auth middleware.
 * @returns Nothing.
 */
export function createUserRoutes(
  router: Router,
  env: ServerEnv,
  userService: UserService,
  jwtRevocationStore?: JwtRevocationStore,
): void {
  const auth = jwtAuthMiddleware(env, jwtRevocationStore)

  router.get("/v1/profile", auth, async (request: AuthRequest, response: Response): Promise<void> => {
    try {
      if (!request.user) {
        response.status(401).json({ error: "Unauthorized" })
        return
      }

      const user = await userService.getUserById(request.user.userId)

      if (!user) {
        response.status(404).json({ error: "User not found" })
        return
      }

      response.status(200).json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt.toISOString(),
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch profile"
      response.status(500).json({ error: message })
    }
  })

  router.patch(
    "/v1/profile",
    auth,
    async (request: AuthRequest, response: Response): Promise<void> => {
      try {
        if (!request.user) {
          response.status(401).json({ error: "Unauthorized" })
          return
        }

        const { name } = request.body as UpdateUserRequest

        const user = await userService.updateUser(request.user.userId, { name })

        if (!user) {
          response.status(404).json({ error: "User not found" })
          return
        }

        response.status(200).json({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt.toISOString(),
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to update profile"
        response.status(500).json({ error: message })
      }
    },
  )

  router.post(
    "/v1/tokens",
    auth,
    async (request: AuthRequest, response: Response): Promise<void> => {
      try {
        if (!request.user) {
          response.status(401).json({ error: "Unauthorized" })
          return
        }

        const { name, scopes, expiresAt } = request.body as CreateTokenRequest

        if (!name) {
          response.status(400).json({ error: "Token name is required" })
          return
        }

        const created = await userService.createAccessToken(
          request.user.userId,
          request.user.tenantId,
          name,
          scopes ?? [],
          expiresAt ? new Date(expiresAt) : null,
        )

        const tokenResponse: TokenResponse = {
          id: created.record.id,
          name: created.record.name,
          token: created.plaintextToken,
          scopes: created.record.scopes,
          createdAt: created.record.createdAt.toISOString(),
          expiresAt: created.record.expiresAt?.toISOString() ?? null,
        }

        response.status(201).json(tokenResponse)
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to create token"
        response.status(500).json({ error: message })
      }
    },
  )

  router.get("/v1/tokens", auth, async (request: AuthRequest, response: Response): Promise<void> => {
    try {
      if (!request.user) {
        response.status(401).json({ error: "Unauthorized" })
        return
      }

      const tokens = await userService.listUserTokens(request.user.userId)

      const tokenResponses: TokenResponse[] = tokens.map((token) => ({
        id: token.id,
        name: token.name,
        token: "",
        scopes: token.scopes,
        createdAt: token.createdAt.toISOString(),
        expiresAt: token.expiresAt?.toISOString() ?? null,
      }))

      response.status(200).json(tokenResponses)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch tokens"
      response.status(500).json({ error: message })
    }
  })

  router.delete(
    "/v1/tokens/:tokenId",
    auth,
    async (request: AuthRequest, response: Response): Promise<void> => {
      try {
        if (!request.user) {
          response.status(401).json({ error: "Unauthorized" })
          return
        }

        const tokenId = request.params.tokenId as string

        const token = await userService.getAccessToken(tokenId)

        if (!token || token.userId !== request.user.userId) {
          response.status(404).json({ error: "Token not found" })
          return
        }

        await userService.revokeToken(tokenId)

        response.status(204).send()
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to revoke token"
        response.status(500).json({ error: message })
      }
    },
  )
}
