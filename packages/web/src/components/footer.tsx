/**
 * Site footer with product, open-source, and docs link columns.
 */

import { APP_VERSION } from "@limetry/sdk"
import { SiteFooter } from "@limetry/ui/site-footer"
import type { DrawerLinkProps } from "@limetry/ui/drawer"
import Link from "next/link"

import { Logo } from "@/components/brand"
import { CloudCtaBanner } from "@/components/cloud-cta-banner"
import { isLaunchOpen } from "@/lib/launching-soon"
import { siteUrls } from "@/lib/site-urls"
import { buildSiteFooterLinks } from "@limetry/ui/site-footer-links"

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
export function Footer(): React.JSX.Element {
  const footerLinks = buildSiteFooterLinks({
    ossWebOrigin: siteUrls.web,
    cloudAppOrigin: siteUrls.cloudWeb,
    openApiHref: `${siteUrls.api}/openapi`,
    githubUrl: siteUrls.github,
    includeCloudLink: isLaunchOpen(),
    ossLinksRelative: true,
  })

  return (
    <>
      {isLaunchOpen() ? <CloudCtaBanner /> : null}
      <SiteFooter
        links={footerLinks}
        brand={<Logo className="h-8 w-auto" />}
        LinkComponent={FooterLink}
        version={APP_VERSION}
        discordHref={siteUrls.discord}
      />
    </>
  )
}
