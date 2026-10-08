"use client"

/**
 * Sticky site header, desktop nav, mobile drawer, and search shortcut (⌘K).
 */

import { type DrawerLinkProps, DrawerMenu, isNavItemActive, type NavItem } from "@limetry/ui/drawer"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

import { Logo } from "@/components/brand"
import { SiteSearchDialog } from "@/components/site-search-dialog"
import { ThemeToggle } from "@/components/theme-toggle"
import { isLaunchOpen } from "@/lib/launching-soon"
import { isExternalHref, siteUrls } from "@/lib/site-urls"

/**
 * Props for {@link Nav}.
 */
type NavProps = {
  /**
   * Nested docs tree from fumadocs (optional).
   */
  docsChildren?: NavItem[]
}

/**
 * Assembles top-level marketing nav items including docs children.
 *
 * @param docsChildren - Docs dropdown children.
 * @returns Flat top-level nav items.
 */
function buildNavItems(docsChildren: NavItem[]): NavItem[] {
  return [
    { href: "/", label: "Home" },
    { href: "/blog", label: "Blog" },
    { href: "/community", label: "Community" },
    {
      href: "/docs/introduction",
      label: "Docs",
      children: docsChildren.length > 0 ? docsChildren : undefined,
    },
    { href: "/examples", label: "Examples" },
    { href: `${siteUrls.api}/openapi`, label: "API" },
  ]
}

/**
 * Active-state helper for desktop nav links (docs prefix match).
 *
 * @param pathname - Current pathname.
 * @param item - Nav item under test.
 * @returns `true` when the item should show as current.
 */
function isDesktopNavActive(pathname: string, item: NavItem): boolean {
  if (item.href.startsWith("http")) {
    return false
  }
  if (item.href.startsWith("/docs")) {
    return pathname.startsWith("/docs")
  }
  return isNavItemActive(pathname, item.href)
}

/**
 * Next.js `Link` adapter for `\@limetry/ui/drawer` drawer items.
 *
 * @param props - Drawer link props from the shared UI package.
 * @returns Anchor link.
 */
function DrawerNavLink({ href, onClick, children, className }: DrawerLinkProps): React.JSX.Element {
  if (/^https?:\/\//i.test(href)) {
    return (
      <a href={href} onClick={onClick} className={className}>
        {children}
      </a>
    )
  }

  return (
    <Link href={href} onClick={onClick} className={className}>
      {children}
    </Link>
  )
}

/**
 * Sticky marketing header with search, theme toggle, and mobile drawer.
 *
 * @param props - Optional docs tree for the Docs dropdown.
 * @returns Header chrome plus drawer and search dialog.
 */
export function Nav({ docsChildren = [] }: NavProps): React.JSX.Element {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const pathname = usePathname() ?? ""
  const navItems = buildNavItems(docsChildren)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      const isModK = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k"
      if (isModK) {
        event.preventDefault()
        setSearchOpen((open) => !open)
        setMenuOpen(false)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [])

  useEffect(() => {
    queueMicrotask(() => {
      setSearchOpen(false)
      setMenuOpen(false)
    })
  }, [pathname])

  const dismissSearch = (): void => {
    setSearchOpen(false)
  }

  return (
    <>
      <header
        className={`sticky top-0 border-b border-border/60 bg-background/95 backdrop-blur-xl ${
          searchOpen ? "z-70" : "z-50"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-6 md:gap-8">
            <Link
              href="/"
              className="flex shrink-0 items-center"
              aria-label="Limetry home"
              onClick={dismissSearch}
            >
              <Logo className="h-8 w-auto max-w-none shrink-0 object-contain" />
            </Link>

            <nav className="hidden min-w-0 items-center gap-4 lg:flex xl:gap-6">
              {navItems.map((link) => {
                const active = isDesktopNavActive(pathname, link)
                return (
                  /^https?:\/\//i.test(link.href) ? (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={dismissSearch}
                      aria-current={active ? "page" : undefined}
                      className={`whitespace-nowrap text-sm font-medium transition-colors hover:text-foreground ${
                        active
                          ? "font-semibold text-emerald-600 dark:text-emerald-400"
                          : "text-muted-foreground"
                      }`}
                      {...(isExternalHref(link.href)
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={dismissSearch}
                      aria-current={active ? "page" : undefined}
                      className={`whitespace-nowrap text-sm font-medium transition-colors hover:text-foreground ${
                        active
                          ? "font-semibold text-emerald-600 dark:text-emerald-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      {link.label}
                    </Link>
                  )
                )
              })}
            </nav>
          </div>

          <div className="hidden shrink-0 items-center gap-2 lg:flex">
            <SearchButton
              active={searchOpen}
              onClick={() => {
                setSearchOpen((open) => !open)
                setMenuOpen(false)
              }}
            />
            <Link
              href={siteUrls.github}
              target="_blank"
              rel="noopener noreferrer"
              onClick={dismissSearch}
              className="flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <GitHubIcon className="size-4" />
              <span className="hidden xl:inline">GitHub</span>
            </Link>
            <ThemeToggle />
            {isLaunchOpen() ? (
              <Link
                href={siteUrls.app}
                onClick={dismissSearch}
                className="whitespace-nowrap rounded-lg bg-linear-to-r from-emerald-500 to-cyan-500 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-emerald-400 hover:to-cyan-400 hover:shadow-md"
              >
                Cloud →
              </Link>
            ) : null}
          </div>

          <div className="flex items-center gap-1 lg:hidden">
            <SearchButton
              active={searchOpen}
              onClick={() => {
                setSearchOpen((open) => !open)
                setMenuOpen(false)
              }}
            />
            <ThemeToggle />
            <button
              type="button"
              className="flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => {
                setMenuOpen((value) => !value)
                setSearchOpen(false)
              }}
              aria-label="Toggle navigation"
            >
              {menuOpen ? <XIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
      </header>

      <DrawerMenu
        open={menuOpen}
        onOpenChange={setMenuOpen}
        items={navItems}
        pathname={pathname}
        LinkComponent={DrawerNavLink}
        className="border-border bg-surface"
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Link
              href={siteUrls.github}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMenuOpen(false)}
              className="whitespace-nowrap rounded-lg border border-border px-3 py-2 text-center text-sm font-medium hover:bg-muted"
            >
              GitHub
            </Link>
            {isLaunchOpen() ? (
              <Link
                href={siteUrls.app}
                onClick={() => setMenuOpen(false)}
                className="whitespace-nowrap rounded-lg bg-linear-to-r from-emerald-500 to-cyan-500 px-3 py-2 text-center text-sm font-semibold text-white"
              >
                Cloud →
              </Link>
            ) : null}
          </div>
        }
      />

      <SiteSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  )
}

/**
 * Header search control that opens the site search dialog.
 *
 * @param props - Click handler and pressed state.
 * @returns Search button.
 */
function SearchButton({
  onClick,
  active = false,
}: {
  onClick: () => void
  active?: boolean
}): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={active ? "Close search" : "Open search"}
      aria-pressed={active}
      className={`inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground ${
        active ? "bg-muted text-foreground" : "text-muted-foreground"
      }`}
    >
      <SearchIcon />
      <span className="hidden lg:inline">Search</span>
      <kbd className="hidden rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground xl:inline">
        ⌘K
      </kbd>
    </button>
  )
}

function SearchIcon(): React.JSX.Element {
  return (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
      />
    </svg>
  )
}

function GitHubIcon({ className }: { className?: string }): React.JSX.Element {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  )
}

function MenuIcon(): React.JSX.Element {
  return (
    <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

function XIcon(): React.JSX.Element {
  return (
    <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}
