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
  /** Optional social destinations. */
  discordHref?: string
  /** Additional classes for the footer root. */
  className?: string
}
