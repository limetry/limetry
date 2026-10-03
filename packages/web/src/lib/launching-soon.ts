/**
 * Cloud links stay hidden until `NEXT_PUBLIC_IS_CLOUD_ENABLED` is `"true"`.
 *
 * Static property access so Next can inline the value into the client bundle.
 *
 * @returns Whether Limetry Cloud entry points should render.
 */
export function isLaunchOpen(): boolean {
  return process.env.NEXT_PUBLIC_IS_CLOUD_ENABLED === "true"
}
