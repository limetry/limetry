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
      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
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
  contactHref,
  discordHref,
  className,
}: SiteFooterProps): JSX.Element {
  return (
    <footer
      className={cn(
        // Explicit light/dark fills — NativeWind bakes `bg-card` to white on Expo web.
        "border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950",
        className,
      )}
    >
      <div className="max-w-7xl px-4 py-12 sm:px-6 lg:px-8 mx-auto">
        <div className="gap-8 md:grid-cols-4 grid grid-cols-2">
          <div className="md:col-span-1 col-span-2">
            <LinkComponent href="/" className="inline-flex items-center" ariaCurrent={undefined}>
              {brand}
            </LinkComponent>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{links.blurb}</p>
            {contactHref || discordHref ? (
              <div className="mt-4 gap-2 flex flex-col">
                {contactHref ? (
                  <LinkComponent
                    href={contactHref}
                    className="
                      text-sm text-muted-foreground
                      hover:text-foreground
                      transition-colors
                    "
                  >
                    Contact
                  </LinkComponent>
                ) : null}
                {discordHref ? (
                  <LinkComponent
                    href={discordHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="
                      text-sm text-muted-foreground
                      hover:text-foreground
                      transition-colors
                    "
                  >
                    Discord
                  </LinkComponent>
                ) : null}
              </div>
            ) : null}
          </div>
          <FooterColumn title="Product" links={links.product} LinkComponent={LinkComponent} />
          <FooterColumn title="Open Source" links={links.opensource} LinkComponent={LinkComponent} />
          <FooterColumn title="Docs" links={links.docs} LinkComponent={LinkComponent} />
        </div>
        <div className="
          mt-10 gap-4 border-border pt-8
          sm:flex-row
          flex flex-col items-center justify-between border-t
        ">
          <p className="text-sm text-muted-foreground">Copyright © {new Date().getFullYear()} Limetry</p>
          <div className="gap-4 flex items-center">
            <FooterAnchor link={links.legal.privacy} LinkComponent={LinkComponent} />
            <FooterAnchor link={links.legal.terms} LinkComponent={LinkComponent} />
            {version ? (
              <span
                className="text-sm text-muted-foreground"
                suppressHydrationWarning
                title="App version"
              >
                {version.startsWith("v") ? version : `v${version}`}
              </span>
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
