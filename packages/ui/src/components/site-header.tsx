/**
 * Shared native site header with the same slots as the web implementation.
 */

import { useState } from "react"
import { Pressable, View } from "react-native"

import { DrawerMenu } from "./drawer-menu"
import { MenuIcon, XIcon } from "./icons"
import type { SiteHeaderProps } from "./site-header.types"

export type { SiteHeaderLinkProps, SiteHeaderProps } from "./site-header.types"

/**
 * Native implementation of the shared site header contract.
 *
 * @param props - Brand, navigation, host link adapter, and action slots.
 * @returns Native header and mobile drawer.
 */
export function SiteHeader({
  brand,
  brandHref,
  items,
  pathname,
  LinkComponent,
  mobileActions,
  drawerFooter,
  renderIcon,
  drawerClassName,
}: SiteHeaderProps): React.JSX.Element {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <View className="z-20 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <View className="h-16 flex-row items-center justify-between px-4">
          <LinkComponent href={brandHref} className="shrink-0 flex-row items-center">
            {brand}
          </LinkComponent>
          <View className="flex-row items-center gap-1">
            {mobileActions}
            <Pressable
              accessibilityLabel={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              accessibilityRole="button"
              className="rounded-lg p-2 active:opacity-80"
              onPress={() => {
                setMenuOpen((value) => !value)
              }}
            >
              {menuOpen ? <XIcon className="text-slate-600 dark:text-slate-400" /> : <MenuIcon className="text-slate-600 dark:text-slate-400" />}
            </Pressable>
          </View>
        </View>
      </View>
      <DrawerMenu
        open={menuOpen}
        onOpenChange={setMenuOpen}
        items={items}
        pathname={pathname}
        LinkComponent={LinkComponent}
        renderIcon={renderIcon}
        footer={drawerFooter}
        className={drawerClassName}
      />
    </>
  )
}
