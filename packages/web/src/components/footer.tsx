/**
 * Site footer with product, open-source, and docs link columns.
 */

import { AppVersion } from "@limetry/sdk"
import type { DrawerLinkProps } from "@limetry/ui/drawer"
import { SiteFooter } from "@limetry/ui/site-footer"
import { buildSiteFooterLinks } from "@limetry/ui/site-footer-links"
import Link from "next/link"

import { Logo } from "@/components/brand"
import { CloudCtaBanner } from "@/components/cloud-cta-banner"
import { ContactSection } from "@/components/contact-section"
import { isLaunchOpen } from "@/lib/launching-soon"
import { siteUrls } from "@/lib/site-urls"

export type FooterProps = {
  /**
   * When false, OSS destinations use absolute `siteUrls.web` hrefs so the
   * footer is safe on the API host landing page.
   */
  ossLinksRelative?: boolean
  /**
   * When false, hides the brief contact strip (e.g. on `/contact`).
   */
  showContact?: boolean
}

function FooterLink(props: DrawerLinkProps): React.JSX.Element {
  const { href, children, onClick, target, rel } = props
  return (
    <Link
      href={href}
      onClick={onClick}
      target={target}
      rel={rel}
      aria-current={props.ariaCurrent}
      className={props.className}
    >
      {children}
    </Link>
  )
}

/** Renders the shared site footer with the OSS-specific Cloud CTA. */
export function Footer(props: FooterProps = {}): React.JSX.Element {
  const ossLinksRelative = props.ossLinksRelative ?? true
  const showContact = props.showContact ?? true
  const footerLinks = buildSiteFooterLinks({
    ossWebOrigin: siteUrls.web,
    cloudAppOrigin: siteUrls.cloudWeb,
    openApiHref: `${siteUrls.api}/openapi`,
    githubUrl: siteUrls.github,
    includeCloudLink: isLaunchOpen(),
    ossLinksRelative,
  })

  return (
    <>
      {showContact ? <ContactSection /> : null}
      {isLaunchOpen() ? <CloudCtaBanner /> : null}
      <SiteFooter
        links={footerLinks}
        brand={<Logo className="h-8 w-auto" />}
        LinkComponent={FooterLink}
        version={AppVersion()}
        contactHref={
          ossLinksRelative ? "/contact" : `${siteUrls.web.replace(/\/$/, "")}/contact`
        }
        discordHref={siteUrls.discord}
      />
    </>
  )
}
