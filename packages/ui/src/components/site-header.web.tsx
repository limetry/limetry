"use client"

/**
 * Shared DOM site header for the OSS and enterprise web frontends.
 */

import type { ComponentType, JSX } from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

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

function externalLinkProps(href: string): Pick<SiteHeaderLinkProps, "rel" | "target"> {
  if (!isExternalHref(href)) {
    return {}
  }
  return { rel: "noopener noreferrer", target: "_blank" }
}

type HeaderNavLinkProps = SiteHeaderLinkProps & {
  LinkComponent: ComponentType<SiteHeaderLinkProps>
  onHeaderNavigate?: () => void
}

/**
 * Stable adapter so drawer and desktop links do not remount when the header re-renders.
 */
function HeaderNavLink({
  LinkComponent,
  onHeaderNavigate,
  onClick,
  ...props
}: HeaderNavLinkProps): JSX.Element {
  return (
    <LinkComponent
      {...props}
      onClick={() => {
        onClick?.()
        onHeaderNavigate?.()
      }}
    />
  )
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
  scrollHide = false,
}: SiteHeaderProps): JSX.Element {
  const [internalMenuOpen, setInternalMenuOpen] = useState(false)
  const [scrollHidden, setScrollHidden] = useState(false)
  const lastScrollY = useRef(0)
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

  const NavLink = useMemo((): ComponentType<SiteHeaderLinkProps> => {
    function BoundHeaderNavLink(props: SiteHeaderLinkProps): JSX.Element {
      return (
        <HeaderNavLink
          {...props}
          LinkComponent={LinkComponent}
          onHeaderNavigate={onNavigate}
        />
      )
    }
    return BoundHeaderNavLink
  }, [LinkComponent, onNavigate])

  useEffect(() => {
    setInternalMenuOpen(false)
    onMenuOpenChange?.(false)
  }, [pathname, onMenuOpenChange])

  useEffect(() => {
    if (!scrollHide) {
      return
    }

    const host = globalThis as {
      scrollY?: number
      addEventListener?: (type: string, listener: () => void, options?: { passive?: boolean }) => void
      removeEventListener?: (type: string, listener: () => void) => void
      queueMicrotask?: (callback: () => void) => void
    }
    if (typeof host.addEventListener !== "function" || typeof host.removeEventListener !== "function") {
      return
    }

    lastScrollY.current = typeof host.scrollY === "number" ? host.scrollY : 0

    const onScroll = (): void => {
      const y = typeof host.scrollY === "number" ? host.scrollY : 0
      const previous = lastScrollY.current
      if (y > previous + 4 && y > 64) {
        setScrollHidden(true)
      } else if (y < previous - 2) {
        setScrollHidden(false)
      }
      lastScrollY.current = y
    }

    host.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      host.removeEventListener?.("scroll", onScroll)
    }
  }, [scrollHide])

  useEffect(() => {
    if (!scrollHide || !menuOpen) {
      return
    }
    const schedule = (globalThis as { queueMicrotask?: (callback: () => void) => void }).queueMicrotask
      ?? ((callback: () => void) => {
        setTimeout(callback, 0)
      })
    schedule(() => {
      setScrollHidden(false)
    })
  }, [menuOpen, scrollHide])

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full border-b transition-transform duration-200 ease-out will-change-transform",
          scrollHide
            ? "border-border/40 bg-background/55 backdrop-blur-xl supports-[backdrop-filter]:bg-background/45"
            : "border-border/60 bg-background/95 backdrop-blur-xl",
          scrollHide && scrollHidden && !menuOpen ? "-translate-y-full" : "translate-y-0",
          className,
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-6 md:gap-8">
            <NavLink href={brandHref} className="flex shrink-0 items-center">
              {brand}
            </NavLink>

            {showDesktopNav ? (
              <nav className="hidden min-w-0 items-center gap-4 md:flex md:gap-5 xl:gap-6">
                {items.map((item) => {
                  const active = isDesktopItemActive(pathname, item.href)
                  return (
                    <NavLink
                      key={item.href}
                      href={item.href}
                      {...externalLinkProps(item.href)}
                      onClick={() => {
                        setMenuOpen(false)
                      }}
                      ariaCurrent={active ? "page" : undefined}
                      className={cn(
                        "whitespace-nowrap text-sm transition-colors hover:text-foreground",
                        active
                          ? "font-semibold text-emerald-600 dark:text-emerald-400"
                          : "font-medium text-muted-foreground",
                      )}
                    >
                      {item.label}
                    </NavLink>
                  )
                })}
              </nav>
            ) : null}
          </div>

          <div className="hidden shrink-0 flex-nowrap items-center gap-2 md:flex">
            {desktopActions}
          </div>

          <div className="flex items-center gap-1 md:hidden">
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
        LinkComponent={NavLink}
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
