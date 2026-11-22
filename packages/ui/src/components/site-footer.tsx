import { Text, View } from "react-native"

import type { SiteFooterLink, SiteFooterProps } from "./site-footer.types"

export type { SiteFooterLink, SiteFooterLinks, SiteFooterProps } from "./site-footer.types"

/** Shared NativeWind footer used by Expo web and native-compatible shells. */
export function SiteFooter({
  links,
  brand,
  LinkComponent,
  version,
  contactHref,
  discordHref,
}: SiteFooterProps): React.JSX.Element {
  return (
    <View className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 border-t">
      <View className="max-w-7xl px-4 py-12 sm:px-6 lg:px-8 mx-auto w-full">
        <View className="gap-8 md:grid-cols-4 grid grid-cols-2">
          <View className="max-w-xs md:col-span-1 col-span-2">
            <LinkComponent href="/" className="inline-flex">
              {brand}
            </LinkComponent>
            <Text className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              {links.blurb}
            </Text>
            {contactHref || discordHref ? (
              <View className="mt-4 gap-2">
                {contactHref ? (
                  <LinkComponent href={contactHref} className="inline-flex">
                    <Text className="text-sm text-slate-500 dark:text-slate-400">Contact</Text>
                  </LinkComponent>
                ) : null}
                {discordHref ? (
                  <LinkComponent
                    href={discordHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex"
                  >
                    <Text className="text-sm text-slate-500 dark:text-slate-400">Discord</Text>
                  </LinkComponent>
                ) : null}
              </View>
            ) : null}
          </View>
          <FooterColumn title="Product" links={links.product} LinkComponent={LinkComponent} />
          <FooterColumn title="Open Source" links={links.opensource} LinkComponent={LinkComponent} />
          <FooterColumn title="Docs" links={links.docs} LinkComponent={LinkComponent} />
        </View>
        <View className="
          mt-10 gap-4 border-slate-200 pt-8
          sm:flex-row
          dark:border-slate-800
          flex-col items-center justify-between border-t
        ">
          <Text className="text-sm text-slate-500 dark:text-slate-400">
            {`Copyright © ${new Date().getFullYear()} Limetry`}
          </Text>
          <View className="gap-4 flex-row flex-wrap items-center">
            <FooterLinkRow link={links.legal.privacy} LinkComponent={LinkComponent} />
            <FooterLinkRow link={links.legal.terms} LinkComponent={LinkComponent} />
            {version ? (
              <Text className="text-sm text-slate-500 dark:text-slate-400" accessibilityLabel="App version">
                {version.startsWith("v") ? version : `v${version}`}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    </View>
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
}): React.JSX.Element {
  return (
    <View className="min-w-32">
      <Text className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</Text>
      <View className="mt-4 gap-2">
        {links.map((link) => (
          <FooterLinkRow key={`${link.label}-${link.href}`} link={link} LinkComponent={LinkComponent} />
        ))}
      </View>
    </View>
  )
}

function FooterLinkRow({
  link,
  LinkComponent,
}: {
  link: SiteFooterLink
  LinkComponent: SiteFooterProps["LinkComponent"]
}): React.JSX.Element {
  return (
    <LinkComponent
      href={link.href}
      {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="inline-flex"
    >
      <Text className="text-sm text-slate-500 dark:text-slate-400">{link.label}</Text>
    </LinkComponent>
  )
}
