/**
 * Shared native site header with the same slots as the web implementation.
 */

import { useState } from "react"
import { Pressable, View } from "react-native"

import { cn } from "../lib/cn"
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
  desktopActions,
  mobileActions,
  drawerFooter,
  renderIcon,
  drawerClassName,
  menuOpen,
  onMenuOpenChange,
  onNavigate,
  className,
  topOffset,
  scrollHide: _scrollHide,
}: SiteHeaderProps): React.JSX.Element {
  const [internalMenuOpen, setInternalMenuOpen] = useState(false)
  const isMenuOpen = menuOpen ?? internalMenuOpen
  const updateMenuOpen = (open: boolean): void => {
    setInternalMenuOpen(open)
    onMenuOpenChange?.(open)
  }
  const NavigationLink: SiteHeaderProps["LinkComponent"] = ({
    onPress,
    ...props
  }) => (
    <LinkComponent
      {...props}
      onPress={() => {
        onPress?.()
        onNavigate?.()
      }}
    />
  )

  return (
    <>
      <View className={cn(
        "z-20 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900",
        className,
      )}>
        <View className="h-16 flex-row items-center justify-between px-4">
          <LinkComponent
            href={brandHref}
            className="shrink-0 flex-row items-center"
            onPress={onNavigate}
          >
            {brand}
          </LinkComponent>
          <View className="flex-row items-center gap-1">
            {desktopActions}
            {mobileActions}
            <Pressable
              accessibilityLabel={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              accessibilityRole="button"
              className="rounded-lg p-2 active:opacity-80"
              onPress={() => {
                updateMenuOpen(!isMenuOpen)
              }}
            >
              {isMenuOpen ? <XIcon className="text-slate-600 dark:text-slate-400" /> : <MenuIcon className="text-slate-600 dark:text-slate-400" />}
            </Pressable>
          </View>
        </View>
      </View>
      <DrawerMenu
        open={isMenuOpen}
        onOpenChange={updateMenuOpen}
        items={items}
        pathname={pathname}
        LinkComponent={NavigationLink}
        renderIcon={renderIcon}
        footer={drawerFooter}
        topOffset={topOffset}
        className={drawerClassName}
      />
    </>
  )
}
