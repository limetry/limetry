import type { ComponentType, ReactNode } from "react"

import type { SiteFooterLink,SiteFooterLinks } from "../lib/site-footer-links"
import type { DrawerLinkProps } from "./drawer-menu.types"

export type { SiteFooterLink, SiteFooterLinks }

export type SiteFooterProps = {
  /** Canonical footer destinations for this host. */
  links: SiteFooterLinks
  /** Brand mark rendered in the footer. */
  brand: ReactNode
  /** Router adapter supplied by the host app. */
  LinkComponent: ComponentType<DrawerLinkProps>
  /** Product version displayed in the legal bar. */
  version?: string
  /**
   * Same-product contact page (shown above Discord in the brand column).
   */
  contactHref?: string
  /** Optional Discord invite URL. */
  discordHref?: string
  /** Additional classes for the footer root. */
  className?: string
}
