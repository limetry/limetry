/**
 * Shared Vercel project target definitions for OSS and enterprise deploy/watch scripts.
 *
 * Project names are overridable via env (`VERCEL_WEB_PROJECT`, `VERCEL_API_PROJECT`,
 * `VERCEL_PORTAL_PROJECT`). Used by `deploy-vercel.ts` and `watch-vercel.ts`.
 */

/** One Vercel project to deploy or watch. */
export type VercelTarget = {
  /** Relative directory for `vercel --cwd` (CLI deploy path). */
  cwd: string
  /** Short label for logs. */
  label: string
  /** Vercel project name / id. */
  project: string
}

/**
 * OSS Vercel projects triggered by the GitHub webhook (override with env).
 *
 * @returns Web and API targets for the limetry OSS monorepo.
 */
export function ossVercelTargets(): VercelTarget[] {
  return [
    {
      label: "web",
      cwd: "packages/web",
      project: process.env.VERCEL_WEB_PROJECT ?? "limetry-dev-web",
    },
    {
      label: "api",
      cwd: "packages/server",
      project: process.env.VERCEL_API_PROJECT ?? "limetry-dev-api",
    },
  ]
}

/**
 * Enterprise Vercel projects triggered by the GitHub webhook (override with env).
 *
 * @returns Portal and server targets for limetry-enterprise style layouts.
 */
export function enterpriseVercelTargets(): VercelTarget[] {
  return [
    {
      label: "portal",
      cwd: "packages/portal",
      project: process.env.VERCEL_PORTAL_PROJECT ?? "limetry-cloud-portal",
    },
    {
      label: "server",
      cwd: "packages/server",
      project: process.env.VERCEL_API_PROJECT ?? "limetry-cloud-server",
    },
  ]
}
