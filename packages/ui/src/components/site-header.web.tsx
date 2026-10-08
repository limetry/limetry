"use client"

/**
 * Shared DOM site header for the OSS and enterprise web frontends.
 */

import type { JSX } from "react"
import { useCallback, useEffect, useState } from "react"

import { cn } from "../lib/cn"
import { isNavItemActive } from "../navigation/types"
import { DrawerMenu } from "./drawer-menu.web"
import type { SiteHeaderLinkProps, SiteHeaderProps } from "./site-header.types"

export type { SiteHeaderLinkProps, SiteHeaderProps } from "./site-header.types"

function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href)
}

function isDesktopItemActive(pathname: string, href: string): boolean {
  if (isExternalHref(href)) {
    return false
  }
  if (href.startsWith("/docs")) {
    return pathname.startsWith("/docs")
  }
  return isNavItemActive(pathname, href)
}

/**
 * Shared sticky header and mobile navigation drawer.
 *
 * @param props - Brand, navigation, host link adapter, and action slots.
 * @returns Site header and mobile drawer.
 */
export function SiteHeader({
  brand,
  brandHref,
  items,
  pathname,
  LinkComponent,
  showDesktopNav = true,
  desktopActions,
  mobileActions,
  drawerFooter,
  menuOpen: controlledMenuOpen,
  onMenuOpenChange,
  onNavigate,
  renderIcon,
  className,
  drawerClassName,
  topOffset = 64,
}: SiteHeaderProps): JSX.Element {
  const [internalMenuOpen, setInternalMenuOpen] = useState(false)
  const menuOpen = controlledMenuOpen ?? internalMenuOpen
  const setMenuOpen = useCallback(
    (open: boolean): void => {
      if (controlledMenuOpen === undefined) {
        setInternalMenuOpen(open)
      }
      onMenuOpenChange?.(open)
    },
    [controlledMenuOpen, onMenuOpenChange],
  )
  const NavigationLink = (props: SiteHeaderLinkProps): JSX.Element => (
    <LinkComponent
      {...props}
      onClick={() => {
        props.onClick?.()
        onNavigate?.()
      }}
    />
  )

  useEffect(() => {
    let cancelled = false
    void Promise.resolve().then(() => {
      if (!cancelled) {
        setMenuOpen(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [pathname, setMenuOpen])

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur-xl",
          className,
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-6 md:gap-8">
            <NavigationLink href={brandHref} className="flex shrink-0 items-center">
              {brand}
            </NavigationLink>

            {showDesktopNav ? (
              <nav className="hidden min-w-0 items-center gap-4 lg:flex xl:gap-6">
                {items.map((item) => {
                  const active = isDesktopItemActive(pathname, item.href)
                  return (
                    <NavigationLink
                      key={item.href}
                      href={item.href}
                      onClick={() => {
                        setMenuOpen(false)
                      }}
                      ariaCurrent={active ? "page" : undefined}
                      className={cn(
                        "whitespace-nowrap text-sm font-medium transition-colors hover:text-foreground",
                        active
                          ? "font-semibold text-emerald-600 dark:text-emerald-400"
                          : "text-muted-foreground",
                      )}
                    >
                      {item.label}
                    </NavigationLink>
                  )
                })}
              </nav>
            ) : null}
          </div>

          <div className="hidden shrink-0 items-center gap-2 lg:flex">{desktopActions}</div>

          <div className="flex items-center gap-1 lg:hidden">
            {mobileActions}
            <button
              type="button"
              className="flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => {
                setMenuOpen(!menuOpen)
              }}
              aria-label={menuOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
      </header>

      <DrawerMenu
        open={menuOpen}
        onOpenChange={setMenuOpen}
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

function MenuIcon(): JSX.Element {
  return (
    <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

function CloseIcon(): JSX.Element {
  return (
    <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}
