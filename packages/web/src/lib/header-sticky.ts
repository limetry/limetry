/**
 * Public flag for glass sticky headers that hide on scroll down.
 */

/**
 * Whether marketing headers use glass sticky scroll-hide chrome.
 *
 * @returns `true` when `NEXT_PUBLIC_IS_HEADER_STICKY` is exactly `"true"`.
 */
export function isHeaderSticky(): boolean {
  return process.env.NEXT_PUBLIC_IS_HEADER_STICKY === "true"
}

/**
 * Whether the site header should hide on scroll-down for this pathname.
 *
 * Docs keep a pinned header so the fumadocs sidebar stays visually attached
 * to site chrome. Other routes honor {@link isHeaderSticky}.
 *
 * @param pathname - Current Next.js pathname (leading slash).
 * @returns Whether scroll-hide should be enabled.
 */
export function shouldScrollHideHeader(pathname: string): boolean {
  if (!isHeaderSticky()) {
    return false
  }

  const path = pathname.trim()
  if (path === "/docs" || path.startsWith("/docs/")) {
    return false
  }

  return true
}
