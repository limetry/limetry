/**
 * Tenant rules CRUD routes for `\@limetry/server`.
 *
 * Accepts JWT or bearer API tokens via {@link createJwtOrBearerAuthMiddleware}.
 */

import type { Response, Router } from "express"

import type { ServerEnv } from "../env.js"
import {
  type AuthRequest,
  createJwtOrBearerAuthMiddleware,
} from "../middleware/jwt-auth.js"
import type { JwtRevocationStore } from "../services/jwt-revocation-store.js"
import type { UserService } from "../services/user-service.js"
import type { CreateRuleRequest, RuleResponse, UpdateRuleRequest } from "../types.js"

/**
 * Registers `/v1/rules` list/create/get/patch/delete handlers.
 *
 * @param router - Express router or app.
 * @param env - Server env for dual JWT/bearer auth.
 * @param userService - Rule persistence.
 * @param jwtRevocationStore - Optional JWT revocation.
 * @returns Nothing.
 */
export function createRuleRoutes(
  router: Router,
  env: ServerEnv,
  userService: UserService,
  jwtRevocationStore?: JwtRevocationStore,
): void {
  const rulesReadAuth = createJwtOrBearerAuthMiddleware(
    env,
    userService,
    ["rules:read"],
    jwtRevocationStore,
  )
  const rulesWriteAuth = createJwtOrBearerAuthMiddleware(
    env,
    userService,
    ["rules:write"],
    jwtRevocationStore,
  )

  router.post(
    "/v1/rules",
    rulesWriteAuth,
    async (request: AuthRequest, response: Response): Promise<void> => {
      try {
        if (!request.user) {
          response.status(401).json({ error: "Unauthorized" })
          return
        }

        const { name, description, condition, action, priority } =
          request.body as CreateRuleRequest

        if (!name || !condition || !action) {
          response.status(400).json({
            error: "Name, condition, and action are required",
          })
          return
        }

        const rule = await userService.createRule(
          request.user.tenantId,
          name,
          description ?? null,
          condition,
          action,
          priority ?? 0,
        )

        const ruleResponse: RuleResponse = {
          id: rule.id,
          name: rule.name,
          description: rule.description ?? undefined,
          condition: rule.condition,
          action: rule.action,
          priority: rule.priority,
          isActive: rule.isActive,
          createdAt: rule.createdAt.toISOString(),
          updatedAt: rule.updatedAt.toISOString(),
        }

        response.status(201).json(ruleResponse)
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to create rule"
        response.status(500).json({ error: message })
      }
    },
  )

  router.get("/v1/rules", rulesReadAuth, async (request: AuthRequest, response: Response): Promise<void> => {
    try {
      if (!request.user) {
        response.status(401).json({ error: "Unauthorized" })
        return
      }

      const rules = await userService.listTenantRules(request.user.tenantId)

      const ruleResponses: RuleResponse[] = rules.map((rule) => ({
        id: rule.id,
        name: rule.name,
        description: rule.description ?? undefined,
        condition: rule.condition,
        action: rule.action,
        priority: rule.priority,
        isActive: rule.isActive,
        createdAt: rule.createdAt.toISOString(),
        updatedAt: rule.updatedAt.toISOString(),
      }))

      response.status(200).json(ruleResponses)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch rules"
      response.status(500).json({ error: message })
    }
  })

  router.get(
    "/v1/rules/:ruleId",
    rulesReadAuth,
    async (request: AuthRequest, response: Response): Promise<void> => {
      try {
        if (!request.user) {
          response.status(401).json({ error: "Unauthorized" })
          return
        }

        const ruleId = request.params.ruleId as string

        const rule = await userService.getRule(ruleId)

        if (!rule || rule.tenantId !== request.user.tenantId) {
          response.status(404).json({ error: "Rule not found" })
          return
        }

        const ruleResponse: RuleResponse = {
          id: rule.id,
          name: rule.name,
          description: rule.description ?? undefined,
          condition: rule.condition,
          action: rule.action,
          priority: rule.priority,
          isActive: rule.isActive,
          createdAt: rule.createdAt.toISOString(),
          updatedAt: rule.updatedAt.toISOString(),
        }

        response.status(200).json(ruleResponse)
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to fetch rule"
        response.status(500).json({ error: message })
      }
    },
  )

  router.patch(
    "/v1/rules/:ruleId",
    rulesWriteAuth,
    async (request: AuthRequest, response: Response): Promise<void> => {
      try {
        if (!request.user) {
          response.status(401).json({ error: "Unauthorized" })
          return
        }

        const ruleId = request.params.ruleId as string

        const existingRule = await userService.getRule(ruleId)

        if (!existingRule || existingRule.tenantId !== request.user.tenantId) {
          response.status(404).json({ error: "Rule not found" })
          return
        }

        const updates = request.body as UpdateRuleRequest

        const rule = await userService.updateRule(ruleId, updates)

        if (!rule) {
          response.status(404).json({ error: "Rule not found" })
          return
        }

        const ruleResponse: RuleResponse = {
          id: rule.id,
          name: rule.name,
          description: rule.description ?? undefined,
          condition: rule.condition,
          action: rule.action,
          priority: rule.priority,
          isActive: rule.isActive,
          createdAt: rule.createdAt.toISOString(),
          updatedAt: rule.updatedAt.toISOString(),
        }

        response.status(200).json(ruleResponse)
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to update rule"
        response.status(500).json({ error: message })
      }
    },
  )

  router.delete(
    "/v1/rules/:ruleId",
    rulesWriteAuth,
    async (request: AuthRequest, response: Response): Promise<void> => {
      try {
        if (!request.user) {
          response.status(401).json({ error: "Unauthorized" })
          return
        }

        const ruleId = request.params.ruleId as string

        const rule = await userService.getRule(ruleId)

        if (!rule || rule.tenantId !== request.user.tenantId) {
          response.status(404).json({ error: "Rule not found" })
          return
        }

        await userService.deleteRule(ruleId)

        response.status(204).send()
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to delete rule"
        response.status(500).json({ error: message })
      }
    },
  )
}
