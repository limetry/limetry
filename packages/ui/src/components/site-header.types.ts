import type { ComponentType, ReactNode } from "react"

import type { NavItem } from "../navigation/types"
import type { DrawerLinkProps } from "./drawer-menu.types"

/**
 * Link contract used by the shared site header and mobile drawer.
 */
export type SiteHeaderLinkProps = DrawerLinkProps

/**
 * Shared web and native site-header inputs.
 */
export type SiteHeaderProps = {
  /** Brand content rendered at the leading edge of the header. */
  brand: ReactNode
  /** Destination used when the brand is selected. */
  brandHref: string
  /** Top-level links shown in desktop navigation and the mobile drawer. */
  items: NavItem[]
  /** Current pathname used for active-link styling. */
  pathname: string
  /** Host router adapter for internal and external links. */
  LinkComponent: ComponentType<SiteHeaderLinkProps>
  /** Whether top-level links render in the desktop header. */
  showDesktopNav?: boolean
  /** Optional controls shown on desktop to the right of navigation. */
  desktopActions?: ReactNode
  /** Optional controls shown on mobile before the menu button. */
  mobileActions?: ReactNode
  /** Optional content pinned below the mobile navigation list. */
  drawerFooter?: ReactNode
  /** Optional controlled state for the mobile navigation drawer. */
  menuOpen?: boolean
  /** Called when the mobile navigation drawer changes state. */
  onMenuOpenChange?: (open: boolean) => void
  /** Called when a header or drawer link is selected. */
  onNavigate?: () => void
  /** Optional icon renderer for drawer navigation rows. */
  renderIcon?: (icon: string, active: boolean) => ReactNode
  /** Optional extra classes for the header element. */
  className?: string
  /** Optional extra classes for the drawer panel. */
  drawerClassName?: string
  /** Offset between the header and the drawer. */
  topOffset?: number
}
