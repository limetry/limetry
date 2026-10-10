/**
 * Shared prop contracts for platform-specific drawer menu implementations.
 *
 * Link and icon rendering are injected so `\@limetry/ui` never imports
 * `next/link` or `expo-router`.
 */

import type { ComponentType, ReactNode } from "react"

import type { NavItem } from "../navigation/types"

export type { NavItem }
export { isNavItemActive } from "../navigation/types"

/**
 * Props accepted by the injected drawer link component.
 */
export type DrawerLinkProps = {
  /**
   * Destination href passed through to the host router link.
   */
  href: string
  /**
   * Web-style click handler (Next / DOM drawer).
   */
  onClick?: () => void
  /**
   * Native press handler (React Native drawer).
   */
  onPress?: () => void
  /**
   * Link contents (typically a row of icon + label).
   */
  children: ReactNode
  /**
   * Optional Tailwind / NativeWind class names for the link root.
   */
  className?: string
  /**
   * Optional browser target for header links.
   */
  target?: string
  /**
   * Optional browser relationship for header links.
   */
  rel?: string
  /**
   * Optional current-page marker for header links.
   */
  ariaCurrent?: "page"
}

/**
 * Props for {@link DrawerMenu} on web and native.
 */
export type DrawerMenuProps = {
  /**
   * Whether the drawer panel is visible / interactive.
   */
  open: boolean
  /**
   * Called when the drawer should open or close.
   *
   * @param open - Desired open state.
   */
  onOpenChange: (open: boolean) => void
  /**
   * Hierarchical nav items rendered in the drawer.
   */
  items: NavItem[]
  /**
   * Current location pathname used for active highlighting.
   */
  pathname: string
  /**
   * Injected so the UI package never imports next/link or expo-router.
   */
  LinkComponent: ComponentType<DrawerLinkProps>
  /**
   * Maps an icon id from NavItem.icon to a rendered node.
   *
   * @param icon - Icon id from the nav item.
   * @param active - Whether the row is the highlighted active leaf.
   * @returns Node to render beside the label, or nothing when omitted.
   */
  renderIcon?: (icon: string, active: boolean) => ReactNode
  /**
   * Optional footer content pinned below the nav list.
   */
  footer?: ReactNode
  /**
   * Offset in pixels below a sticky header. Web default is 64.
   */
  topOffset?: number
  /**
   * Extra class names applied to the drawer panel surface.
   */
  className?: string
  /**
   * Native modal header rendered above the panel so header controls stay pressable.
   * Web drawers ignore this and keep their own sticky header.
   */
  header?: ReactNode
}
