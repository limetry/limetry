import type { JSX } from "react"

import { cn } from "../lib/cn"
import type { SiteFooterLink, SiteFooterProps } from "./site-footer.types"

export type { SiteFooterLink, SiteFooterLinks } from "./site-footer.types"
export type { SiteFooterProps } from "./site-footer.types"

function FooterAnchor({
  link,
  LinkComponent,
}: {
  link: SiteFooterLink
  LinkComponent: SiteFooterProps["LinkComponent"]
}): JSX.Element {
  const external = link.external === true || /^https?:\/\//i.test(link.href)
  return (
    <LinkComponent
      href={link.href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      {link.label}
    </LinkComponent>
  )
}

/** Shared DOM footer used by OSS and Cloud marketing hosts. */
export function SiteFooter({
  links,
  brand,
  LinkComponent,
  version,
  discordHref,
  className,
}: SiteFooterProps): JSX.Element {
  return (
    <footer className={cn("border-t border-border bg-card", className)}>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <LinkComponent href="/" className="inline-flex items-center" ariaCurrent={undefined}>
              {brand}
            </LinkComponent>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{links.blurb}</p>
            {discordHref ? (
              <div className="mt-4">
                <LinkComponent
                  href={discordHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Discord
                </LinkComponent>
              </div>
            ) : null}
          </div>
          <FooterColumn title="Product" links={links.product} LinkComponent={LinkComponent} />
          <FooterColumn title="Open Source" links={links.opensource} LinkComponent={LinkComponent} />
          <FooterColumn title="Docs" links={links.docs} LinkComponent={LinkComponent} />
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">Copyright © {new Date().getFullYear()} Limetry</p>
          <div className="flex items-center gap-4">
            <FooterAnchor link={links.legal.privacy} LinkComponent={LinkComponent} />
            <FooterAnchor link={links.legal.terms} LinkComponent={LinkComponent} />
            {version ? (
              <span className="text-sm text-muted-foreground" title="App version">v{version}</span>
            ) : null}
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({
  title,
  links,
  LinkComponent,
}: {
  title: string
  links: SiteFooterLink[]
  LinkComponent: SiteFooterProps["LinkComponent"]
}): JSX.Element {
  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <ul className="mt-4 space-y-2">
        {links.map((link) => (
          <li key={`${link.label}-${link.href}`}>
            <FooterAnchor link={link} LinkComponent={LinkComponent} />
          </li>
        ))}
      </ul>
    </div>
  )
}
