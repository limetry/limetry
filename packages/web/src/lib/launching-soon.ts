/**
 * Cloud marketing CTAs on limetry.org (nav, footer, `/pricing`).
 *
 * Matches the API landing flag in `@limetry/server` (`NEXT_PUBLIC_IS_CLOUD_ENABLED`).
 * `NEXT_PUBLIC_LAUNCHING_SOON` remains supported for legacy stacks that set it alone.
 *
 * Static property access so Next can inline values into the client bundle.
 *
 * @returns Whether Limetry Cloud entry points should render.
 */
export function isLaunchOpen(): boolean {
  return (
    process.env.NEXT_PUBLIC_IS_CLOUD_ENABLED === "true"
    || process.env.NEXT_PUBLIC_LAUNCHING_SOON === "true"
  )
}
