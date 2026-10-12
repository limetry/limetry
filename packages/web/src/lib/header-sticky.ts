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
