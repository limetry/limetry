/**
 * Navigation item model and active-route helpers for drawer / tab chrome.
 *
 * Path matching strips Expo / Next route-group segments (for example `/(app)`)
 * so highlight logic works against public pathnames.
 */

/**
 * A single navigable link, optionally nested under a section.
 */
export type NavItem = {
  /**
   * Destination path (may include route-group segments that are normalized away).
   */
  href: string
  /**
   * Human-readable label shown in drawers and tabs.
   */
  label: string
  /**
   * Optional icon id consumed by drawer `renderIcon` callbacks.
   */
  icon?: string
  /**
   * When true, the item is eligible for mobile bottom-tab presentation.
   */
  mobileTab?: boolean
  /**
   * Nested items (for example Docs sections). Drawers render an expand/collapse group.
   */
  children?: NavItem[]
}

/**
 * Strips Expo / Next route-group segments like `/(app)` from a path.
 *
 * @param pathname - Raw router pathname that may include parenthesized groups.
 * @returns Normalized path beginning with `/`, or `"/"` when empty after stripping.
 */
export function normalizePathname(pathname: string): string {
  const withoutOrigin = pathname.replace(/^[a-z][a-z\d+\-.]*:\/\/[^/]+/i, "")
  const withoutQuery = withoutOrigin.split(/[?#]/, 1)[0] ?? ""
  const normalized = withoutQuery.replace(/\/\([^/]+\)/g, "")
  return normalized.length > 0 ? normalized : "/"
}

/**
 * Returns true when pathname matches the item href or a nested child path.
 *
 * Root (`"/"`) matches only the exact root path. Other targets match equality
 * or a prefix followed by `/`.
 *
 * @param pathname - Current location pathname.
 * @param href - Nav item href to test.
 * @returns Whether the pathname is active for that href.
 */
export function isNavItemActive(pathname: string, href: string): boolean {
  const path = normalizePathname(pathname)
  const target = normalizePathname(href)
  if (target === "/") {
    return path === "/"
  }
  return path === target || path.startsWith(`${target}/`)
}

/**
 * True when pathname matches this item or any descendant.
 *
 * @param pathname - Current location pathname.
 * @param item - Nav item that may contain nested `children`.
 * @returns Whether this item or a child is active for the pathname.
 */
export function isNavItemOrChildActive(pathname: string, item: NavItem): boolean {
  if (isNavItemActive(pathname, item.href)) {
    return true
  }
  return item.children?.some((child) => isNavItemOrChildActive(pathname, child)) ?? false
}

/**
 * Returns the href of the single most specific nav item for pathname (longest match;
 * deepest item wins ties). Used so only one drawer row gets active highlight.
 *
 * @param pathname - Current location pathname.
 * @param items - Top-level nav tree to search.
 * @returns Winning item `href`, or `null` when nothing matches.
 */
export function findActiveNavHref(pathname: string, items: NavItem[]): string | null {
  let bestHref: string | null = null
  let bestLength = -1
  let bestDepth = -1

  const walk = (list: NavItem[], depth: number): void => {
    for (const item of list) {
      if (isNavItemActive(pathname, item.href)) {
        const length = normalizePathname(item.href).length
        if (length > bestLength || (length === bestLength && depth > bestDepth)) {
          bestLength = length
          bestDepth = depth
          bestHref = item.href
        }
      }
      if (item.children) {
        walk(item.children, depth + 1)
      }
    }
  }

  walk(items, 0)
  return bestHref
}

/**
 * True when this specific NavItem is the single active highlighted leaf/target for pathname.
 * If this item is a section/folder container and has an active child, it returns false so
 * only the specific child page gets the active highlight.
 *
 * @param pathname - Current location pathname.
 * @param item - Candidate nav item.
 * @param activeHref - Result of {@link findActiveNavHref}, or `null` when none.
 * @returns Whether this item alone should receive the active highlight styles.
 */
export function isItemHighlighted(
  pathname: string,
  item: NavItem,
  activeHref: string | null,
): boolean {
  if (activeHref === null) {
    return false
  }
  const matches = normalizePathname(item.href) === normalizePathname(activeHref)
  if (!matches) {
    return false
  }
  const hasActiveChild =
    item.children?.some((child) => isNavItemOrChildActive(pathname, child)) ?? false
  return !hasActiveChild
}

/**
 * True when this href is the single highlighted drawer item for pathname.
 *
 * @param pathname - Current location pathname.
 * @param href - Href to compare against the winning active item.
 * @param items - Top-level nav tree used to resolve the active href.
 * @returns Whether `href` equals the single highlighted nav href.
 */
export function isHighlightedNavItem(pathname: string, href: string, items: NavItem[]): boolean {
  const activeHref = findActiveNavHref(pathname, items)
  if (activeHref === null) {
    return false
  }
  return normalizePathname(href) === normalizePathname(activeHref)
}
