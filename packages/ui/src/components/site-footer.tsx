import { Text, View } from "react-native"

import type { SiteFooterLink, SiteFooterProps } from "./site-footer.types"

export type { SiteFooterLink, SiteFooterLinks, SiteFooterProps } from "./site-footer.types"

/** Shared NativeWind footer used by Expo web and native-compatible shells. */
export function SiteFooter({
  links,
  brand,
  LinkComponent,
  version,
  discordHref,
}: SiteFooterProps): React.JSX.Element {
  return (
    <View className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <View className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <View className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <View className="col-span-2 max-w-xs md:col-span-1">
            <LinkComponent href="/" className="inline-flex">
              {brand}
            </LinkComponent>
            <Text className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              {links.blurb}
            </Text>
            {discordHref ? (
              <LinkComponent href={discordHref} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex">
                <Text className="text-sm text-slate-500 dark:text-slate-400">Discord</Text>
              </LinkComponent>
            ) : null}
          </View>
          <FooterColumn title="Product" links={links.product} LinkComponent={LinkComponent} />
          <FooterColumn title="Open Source" links={links.opensource} LinkComponent={LinkComponent} />
          <FooterColumn title="Docs" links={links.docs} LinkComponent={LinkComponent} />
        </View>
        <View className="mt-10 flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 sm:flex-row dark:border-slate-800">
          <Text className="text-sm text-slate-500 dark:text-slate-400">
            {`Copyright © ${new Date().getFullYear()} Limetry`}
          </Text>
          <View className="flex-row flex-wrap items-center gap-4">
            <FooterLinkRow link={links.legal.privacy} LinkComponent={LinkComponent} />
            <FooterLinkRow link={links.legal.terms} LinkComponent={LinkComponent} />
            {version ? (
              <Text className="text-sm text-slate-500 dark:text-slate-400" accessibilityLabel="App version">
                {`v${version}`}
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
