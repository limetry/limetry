/**
 * Auth routes for `\@limetry/server`: register, login, and JWT logout/revocation.
 */

import { randomUUID } from "node:crypto"

import type { Request, Response, Router } from "express"
import jwt from "jsonwebtoken"

import type { ServerEnv } from "../env.js"
import { type AuthRequest, jwtAuthMiddleware } from "../middleware/jwt-auth.js"
import type { JwtRevocationStore } from "../services/jwt-revocation-store.js"
import type { UserService } from "../services/user-service.js"
import type { AuthResponse, CreateUserRequest } from "../types.js"

/**
 * JWT lifetime string passed to `jsonwebtoken.sign`.
 */
const JWT_TTL = "12h"

/**
 * JWT lifetime in milliseconds for revocation TTL on logout.
 */
const JWT_TTL_MS = 12 * 60 * 60 * 1000

/**
 * Registers `/v1/auth/register`, `/v1/auth/login`, and `/v1/auth/logout`.
 *
 * Register always mints a fresh tenant id so clients cannot join another tenant.
 * Login requires `tenantId` plus email/password.
 *
 * @param router - Express router or app.
 * @param env - Server env providing `JWT_SECRET`.
 * @param userService - User persistence.
 * @param jwtRevocationStore - Store used to revoke JWT jtis on logout.
 * @returns Nothing.
 */
export function createAuthRoutes(
  router: Router,
  env: ServerEnv,
  userService: UserService,
  jwtRevocationStore: JwtRevocationStore,
): void {
  router.post("/v1/auth/register", async (request: Request, response: Response): Promise<void> => {
    try {
      const { email, password, name } = request.body as CreateUserRequest

      if (!email || !password) {
        response.status(400).json({
          error: "Email and password are required",
        })
        return
      }

      /**
       * Always mint a fresh tenant id so register cannot join or impersonate another tenant.
       */
      const tenantId = randomUUID()

      const user = await userService.createUser(
        email,
        password,
        name ?? null,
        tenantId,
        "MEMBER",
      )

      const jti = randomUUID()
      const token = jwt.sign(
        {
          userId: user.id,
          tenantId: user.tenantId,
          email: user.email,
          jti,
        },
        env.JWT_SECRET,
        { expiresIn: JWT_TTL },
      )

      const responseData: AuthResponse = {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          tenantId: user.tenantId,
        },
      }

      response.status(201).json(responseData)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Registration failed"
      response.status(400).json({ error: message })
    }
  })

  router.post("/v1/auth/login", async (request: Request, response: Response): Promise<void> => {
    try {
      const { email, password, tenantId } = request.body as {
        email: string
        password: string
        tenantId?: string
      }

      if (!email || !password) {
        response.status(400).json({
          error: "Email and password are required",
        })
        return
      }

      if (!tenantId) {
        response.status(400).json({
          error: "tenantId is required for login",
        })
        return
      }

      const user = await userService.getUserByEmail(tenantId, email)

      if (!user || !(await userService.verifyPassword(user, password))) {
        response.status(401).json({
          error: "Invalid credentials",
        })
        return
      }

      const jti = randomUUID()
      const token = jwt.sign(
        {
          userId: user.id,
          tenantId: user.tenantId,
          email: user.email,
          jti,
        },
        env.JWT_SECRET,
        { expiresIn: JWT_TTL },
      )

      const responseData: AuthResponse = {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          tenantId: user.tenantId,
        },
      }

      response.status(200).json(responseData)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed"
      response.status(400).json({ error: message })
    }
  })

  router.post(
    "/v1/auth/logout",
    jwtAuthMiddleware(env, jwtRevocationStore),
    async (request: AuthRequest, response: Response): Promise<void> => {
      if (request.user?.jti) {
        await jwtRevocationStore.revoke(request.user.jti, Date.now() + JWT_TTL_MS)
      }
      response.status(204).send()
    },
  )
}
