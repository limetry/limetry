/**
 * Express app factory and process bootstrap for `\@limetry/server`.
 *
 * Wires auth/user/rules/action routes, optional Postgres/Redis stores, static
 * landing page, health/metrics, and audit retention purge.
 */

import { existsSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import {
  isProductionRuntime,
  isTestEnv,
  resolveDevListenPort,
} from "@limetry/preflight"
import { APP_VERSION } from "@limetry/sdk"
import express from "express"
import { Redis } from "ioredis"
import { Pool } from "pg"

import type { ServerEnv } from "./env.js"
import {
  renderLandingHtml,
  resolveLandingAppOrigin,
  resolveLandingWebOrigin,
} from "./landing-links.js"
import { createBearerAuthMiddleware, requireScopes } from "./middleware/bearer-auth.js"
import { createRequestContextMiddleware, logger, metrics } from "./observability.js"
import { runOssPreflight } from "./preflight.js"
import { createActionRoutes } from "./routes/actions.js"
import { createAuthRoutes } from "./routes/auth.js"
import { createRuleRoutes } from "./routes/rules.js"
import { createUserRoutes } from "./routes/users.js"
import { actionPolicySchema } from "./schemas/action.js"
import {
  type ApprovalStore,
  InMemoryApprovalStore,
} from "./services/approval-store.js"
import {
  type AuditStore,
  InMemoryAuditStore,
  PostgresAuditStore,
} from "./services/audit-store.js"
import type { GovernanceStateStore } from "./services/governance-state-store.js"
import {
  InMemoryJwtRevocationStore,
  type JwtRevocationStore,
} from "./services/jwt-revocation-store.js"
import { type NonceStore, RedisNonceStore } from "./services/nonce-store.js"
import { InMemoryPolicyRegistry, type PolicyRegistry } from "./services/policy-registry.js"
import {
  migratePostgres,
  PostgresGovernanceStateStore,
  PostgresPolicyRegistry,
} from "./services/postgres-store.js"
import { PostgresUserService } from "./services/postgres-user-service.js"
import { SqliteStore } from "./services/sqlite-store.js"
import { InMemoryUserService, type UserService } from "./services/user-service.js"

/**
 * Dependency injection bag for {@link createApp}.
 */
export type CreateAppOptions = {
  /**
   * Validated server environment.
   */
  env: ServerEnv
  /**
   * User/token/rule persistence; defaults to in-memory.
   */
  userService?: UserService
  /**
   * Action/spending policy registry; defaults to in-memory.
   */
  policyRegistry?: PolicyRegistry
  /**
   * Optional governance evaluation state store (Postgres when enabled).
   */
  stateStore?: GovernanceStateStore
  /**
   * Audit event store; defaults to in-memory.
   */
  auditStore?: AuditStore
  /**
   * Pending approval store; defaults to in-memory.
   */
  approvalStore?: ApprovalStore
  /**
   * Replay-protection nonce store (Redis when `REDIS_URL` is set).
   */
  nonceStore?: NonceStore
  /**
   * JWT jti revocation store; defaults to in-memory.
   */
  jwtRevocationStore?: JwtRevocationStore
  /**
   * Explicit path to the static `public/` directory containing `index.html`.
   */
  publicDir?: string
}

/**
 * Resolves the static landing-page directory shipped with `\@limetry/server`.
 *
 * @param explicit - Optional absolute/relative directory override.
 * @returns Directory containing `index.html`, or `null` when none found.
 */
export function resolvePublicDir(explicit?: string): string | null {
  if (explicit && existsSync(join(explicit, "index.html"))) {
    return explicit
  }

  const here = dirname(fileURLToPath(import.meta.url))
  const candidates = [
    join(here, "..", "public"),
    join(process.cwd(), "public"),
    join(process.cwd(), "packages", "server", "public"),
  ]

  for (const candidate of candidates) {
    if (existsSync(join(candidate, "index.html"))) {
      return candidate
    }
  }

  return null
}

/**
 * Builds the Express application with JSON parsing, request context, optional
 * static landing page, health/metrics, and all HTTP route modules.
 *
 * @param options - Env plus optional store overrides for tests.
 * @returns Configured Express app (not listening).
 */
export function createApp(options: CreateAppOptions) {
  const userService = options.userService ?? new InMemoryUserService()
  const policyRegistry = options.policyRegistry ?? new InMemoryPolicyRegistry()
  const auditStore = options.auditStore ?? new InMemoryAuditStore()
  const approvalStore = options.approvalStore ?? new InMemoryApprovalStore()
  if (options.env.LOAD_TEST_POLICY_JSON) {
    try {
      const policy = actionPolicySchema.parse(JSON.parse(options.env.LOAD_TEST_POLICY_JSON))
      void policyRegistry.registerPolicy("default", policy)
    } catch (error) {
      logger.warn(
        { error },
        "load-test policy seed was invalid and was ignored",
      )
    }
  }

  const app = express()
  app.use(express.json({ limit: "1mb" }))
  app.use(createRequestContextMiddleware())
  app.use((_request, _response, next) => {
    metrics.incrementRequests()
    next()
  })

  const publicDir = resolvePublicDir(options.publicDir)
  if (publicDir) {
    app.get("/", (_request, response) => {
      const html = renderLandingHtml(
        readFileSync(join(publicDir, "index.html"), "utf8"),
        {
          appVersion: APP_VERSION,
          appOrigin: resolveLandingAppOrigin(),
          webOrigin: resolveLandingWebOrigin(),
        },
      )
      response.type("html").send(html)
    })

    app.get("/openapi", (_request, response) => {
      const swaggerPage = join(publicDir, "openapi.html")
      if (!existsSync(swaggerPage)) {
        response.redirect(302, "/openapi.yaml")
        return
      }
      response.type("html").send(readFileSync(swaggerPage, "utf8"))
    })

    app.get("/openapi.yaml", (_request, response) => {
      const filePath = join(publicDir, "openapi.yaml")
      if (!existsSync(filePath)) {
        response.status(404).json({ error: "openapi_yaml_missing" })
        return
      }
      response.type("text/yaml").send(readFileSync(filePath, "utf8"))
    })

    app.get("/openapi.json", (_request, response) => {
      const filePath = join(publicDir, "openapi.json")
      if (!existsSync(filePath)) {
        response.status(404).json({ error: "openapi_json_missing" })
        return
      }
      response.type("json").send(readFileSync(filePath, "utf8"))
    })

    app.use(express.static(publicDir, {
      index: false,
      fallthrough: true,
    }))
  }

  const jwtRevocationStore =
    options.jwtRevocationStore ?? new InMemoryJwtRevocationStore()

  app.get("/health", (_request, response) => {
    response.status(200).json({
      ok: true,
      service: "limetry-server",
      version: APP_VERSION,
    })
  })

  app.get(
    "/metrics",
    createBearerAuthMiddleware(options.env, userService),
    requireScopes("metrics:read"),
    (_request, response) => {
      response.status(200).json({ ok: true, metrics: metrics.snapshot() })
    },
  )

  createAuthRoutes(app, options.env, userService, jwtRevocationStore)
  createUserRoutes(app, options.env, userService, jwtRevocationStore)
  createRuleRoutes(app, options.env, userService, jwtRevocationStore)

  createActionRoutes(app, {
    env: options.env,
    policyRegistry,
    auditStore,
    approvalStore,
    userService,
  })

  return app
}

/**
 * Builds a fully wired Express app (SQLite, Postgres, or Redis stores when configured)
 * without binding a TCP port. Used by both the long-running server and Lambda.
 *
 * @param env - Validated server environment.
 * @returns Express app and optional Postgres pool for retention purge.
 * @throws When preflight fails hard, Postgres migrate fails, or Redis ping fails.
 */
export async function prepareApp(env: ServerEnv) {
  await runOssPreflight(env)
  const options: CreateAppOptions = { env }
  let postgresPool: Pool | undefined
  let sqliteStore: SqliteStore | undefined

  if (env.USE_POSTGRES_STORE) {
    const pool = new Pool({ connectionString: env.DATABASE_URL })
    await migratePostgres(pool, "evaluate")
    postgresPool = pool
    options.policyRegistry = new PostgresPolicyRegistry(pool)
    options.stateStore = new PostgresGovernanceStateStore(pool)
    options.userService = new PostgresUserService(pool)
    options.auditStore = new PostgresAuditStore(pool)
  } else {
    sqliteStore = SqliteStore.open(env.SQLITE_DATABASE_PATH)
    options.policyRegistry = sqliteStore.policyRegistry
    options.stateStore = sqliteStore.governanceStateStore
    options.userService = sqliteStore.userService
    options.auditStore = sqliteStore.auditStore
    options.approvalStore = sqliteStore.approvalStore
  }

  if (env.REDIS_URL) {
    const redis = new Redis(env.REDIS_URL, {
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
    })
    await redis.ping()
    options.nonceStore = new RedisNonceStore(redis)
    const { RedisJwtRevocationStore } = await import("./services/jwt-revocation-store.js")
    options.jwtRevocationStore = new RedisJwtRevocationStore(redis)
  }

  return { app: createApp(options), postgresPool, sqliteStore }
}

/**
 * Prepares the app, optionally starts audit retention purge, and listens on
 * `LIMETRY_API_PORT` (with local port hop when preferred port is busy).
 *
 * @param env - Validated server environment (mutated when port hops).
 * @returns Node HTTP server from `app.listen`.
 * @throws When {@link prepareApp} fails or listen fails.
 */
export async function startServer(env: ServerEnv) {
  const hop = await resolveDevListenPort(env.LIMETRY_API_PORT, {
    enabled: !isTestEnv(process.env) && !isProductionRuntime(process.env),
  })
  if (hop.changed) {
    logger.warn(
      { preferred: hop.preferred, port: hop.port },
      "preferred listen port in use; hopping",
    )
    env.LIMETRY_API_PORT = hop.port
    process.env.LIMETRY_API_PORT = String(hop.port)
  }

  const { app, postgresPool, sqliteStore } = await prepareApp(env)

  if (
    postgresPool &&
    env.LIMETRY_AUDIT_RETENTION_DAYS > 0 &&
    process.env.NODE_ENV !== "test"
  ) {
    const { startOssAuditRetentionPurge } = await import("./services/audit-retention.js")
    startOssAuditRetentionPurge(postgresPool, {
      retentionDays: env.LIMETRY_AUDIT_RETENTION_DAYS,
      intervalMs: env.LIMETRY_AUDIT_PURGE_INTERVAL_MS,
    })
  }

  const server = app.listen(env.LIMETRY_API_PORT, () => {
    logger.info({ port: env.LIMETRY_API_PORT, version: APP_VERSION }, "server.listening")
  })
  server.once("close", () => sqliteStore?.close())
  return server
}
