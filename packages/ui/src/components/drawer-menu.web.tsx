/**
 * DOM drawer panel for Next.js / browser consumers.
 *
 * Renders below a sticky header; the header owns the open/close control.
 * Marked `"use client"` for Next App Router. Re-exports navigation helpers
 * used by host apps.
 */

"use client"

import type { JSX } from "react"
import { useEffect, useState } from "react"

import { cn } from "../lib/cn"
import {
  findActiveNavHref,
  isItemHighlighted,
  isNavItemOrChildActive,
} from "../navigation/types"
import type { DrawerMenuProps, NavItem } from "./drawer-menu.types"

export {
  findActiveNavHref,
  isHighlightedNavItem,
  isItemHighlighted,
  isNavItemActive,
  isNavItemOrChildActive,
} from "../navigation/types"
export type { DrawerLinkProps, DrawerMenuProps, NavItem } from "./drawer-menu.types"

/**
 * Default pixel offset below a sticky site header on web.
 */
const DEFAULT_TOP_OFFSET = 64

/**
 * Props for a single recursive drawer row.
 */
type DrawerItemProps = {
  /**
   * Nav item (leaf or branch) to render.
   */
  item: NavItem
  /**
   * Current location pathname.
   */
  pathname: string
  /**
   * Winning active href from {@link findActiveNavHref}.
   */
  activeHref: string | null
  /**
   * Nesting depth; used for indent / rail styling.
   */
  depth: number
  /**
   * Injected host link component.
   */
  LinkComponent: DrawerMenuProps["LinkComponent"]
  /**
   * Optional icon renderer from {@link DrawerMenuProps}.
   */
  renderIcon?: DrawerMenuProps["renderIcon"]
  /**
   * Invoked after a leaf navigation so the drawer can close.
   */
  onNavigate: () => void
}

/**
 * Renders one nav row, expanding nested children when the branch is active.
 *
 * @param props - Item, pathname, active href, depth, and host callbacks.
 * @returns A link row or an expand/collapse branch.
 */
function DrawerNavItem({
  item,
  pathname,
  activeHref,
  depth,
  LinkComponent,
  renderIcon,
  onNavigate,
}: DrawerItemProps): JSX.Element {
  const hasChildren = Boolean(item.children && item.children.length > 0)
  const branchActive = isNavItemOrChildActive(pathname, item)
  const highlighted = isItemHighlighted(pathname, item, activeHref)
  const ancestorActive = branchActive && !highlighted
  const [expanded, setExpanded] = useState(branchActive)

  if (hasChildren && item.children) {
    const open = expanded || branchActive
    return (
      <div className="flex flex-col gap-0.5">
        <div className="flex items-stretch gap-1">
          <LinkComponent
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "relative flex min-w-0 flex-1 items-center justify-start gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              depth > 0 && "pl-3",
              highlighted && depth > 0
                && "before:absolute before:inset-y-1.5 before:-left-[9px] before:w-px before:bg-emerald-500 before:content-['']",
              highlighted
                ? "bg-emerald-500/15 text-emerald-500"
                : ancestorActive
                  ? "font-semibold text-slate-900 dark:text-slate-100"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800",
            )}
          >
            {item.icon && renderIcon ? (
              <span className="flex shrink-0 items-center justify-center">
                {renderIcon(item.icon, highlighted)}
              </span>
            ) : null}
            <span className="text-left">{item.label}</span>
          </LinkComponent>
          <button
            type="button"
            aria-expanded={open}
            aria-label={open ? `Collapse ${item.label}` : `Expand ${item.label}`}
            className={cn(
              "rounded-xl px-2.5 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800",
              (ancestorActive || highlighted) && "text-emerald-500",
            )}
            onClick={() => {
              setExpanded((value) => !value)
            }}
          >
            <ChevronIcon open={open} />
          </button>
        </div>
        {open ? (
          <div className="ml-3 flex flex-col gap-0.5 border-l border-slate-200 pl-2 dark:border-slate-700">
            {item.children.map((child) => (
              <DrawerNavItem
                key={`${child.href}-${child.label}`}
                item={child}
                pathname={pathname}
                activeHref={activeHref}
                depth={depth + 1}
                LinkComponent={LinkComponent}
                renderIcon={renderIcon}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <LinkComponent
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "relative flex items-center justify-start gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        depth > 0 && "py-2 text-[13px]",
        highlighted && depth > 0
          && "before:absolute before:inset-y-1.5 before:-left-[9px] before:w-px before:bg-emerald-500 before:content-['']",
        highlighted
          ? "bg-emerald-500/15 text-emerald-500"
          : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800",
      )}
    >
      {item.icon && renderIcon ? (
        <span className="flex shrink-0 items-center justify-center">
          {renderIcon(item.icon, highlighted)}
        </span>
      ) : null}
      <span className="text-left">{item.label}</span>
    </LinkComponent>
  )
}

/**
 * Chevron affordance for expand/collapse controls.
 *
 * @param props - Whether the branch is currently open.
 * @returns An inline SVG chevron that rotates when open.
 */
function ChevronIcon({ open }: { open: boolean }): JSX.Element {
  return (
    <svg
      className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}

/**
 * DOM drawer panel for Next.js / browser consumers.
 * Renders below a sticky header; the header owns the open/close control.
 *
 * @param props - Open state, nav items, pathname, and injected link/icon renderers.
 * @returns A fixed mobile drawer that slides in from the trailing edge.
 */
export function DrawerMenu({
  open,
  onOpenChange,
  items,
  pathname,
  LinkComponent,
  renderIcon,
  footer,
  topOffset = DEFAULT_TOP_OFFSET,
  className,
}: DrawerMenuProps): JSX.Element {
  const activeHref = findActiveNavHref(pathname, items)

  /**
   * Keeps a sideways swipe from moving the page while the drawer is open.
   */
  useEffect(() => {
    if (!open) {
      return
    }
    const html = document.documentElement
    const previousOverflow = html.style.overflowX
    const previousOverscroll = html.style.overscrollBehaviorX
    const previousTouchAction = html.style.touchAction
    html.style.overflowX = "clip"
    html.style.overscrollBehaviorX = "none"
    html.style.touchAction = "pan-y"
    const blockHorizontalScroll = (event: WheelEvent): void => {
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) {
        return
      }
      event.preventDefault()
      window.scrollTo({ left: 0 })
    }
    window.scrollTo({ left: 0 })
    window.addEventListener("wheel", blockHorizontalScroll, { passive: false })
    return () => {
      window.removeEventListener("wheel", blockHorizontalScroll)
      html.style.overflowX = previousOverflow
      html.style.overscrollBehaviorX = previousOverscroll
      html.style.touchAction = previousTouchAction
      window.scrollTo({ left: 0 })
    }
  }, [open])

  return (
    <div
      className="limetry-mobile-drawer pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-end overflow-hidden"
      style={{ top: topOffset }}
      aria-hidden={!open}
    >
      <nav
        inert={!open}
        className={cn(
          "pointer-events-auto flex h-full w-72 max-w-[85vw] shrink-0 flex-col items-stretch gap-1 overflow-y-auto overscroll-y-contain border-l border-slate-200 bg-white p-4 shadow-xl transition-transform duration-300 ease-in-out dark:border-slate-800 dark:bg-slate-900",
          open ? "translate-x-0" : "translate-x-full",
          className,
        )}
      >
        <div className="flex flex-col items-stretch gap-1">
          {items.map((item) => (
            <DrawerNavItem
              key={`${item.href}-${item.label}`}
              item={item}
              pathname={pathname}
              activeHref={activeHref}
              depth={0}
              LinkComponent={LinkComponent}
              renderIcon={renderIcon}
              onNavigate={() => {
                onOpenChange(false)
              }}
            />
          ))}
        </div>
        {footer ? <div className="mt-auto flex flex-col items-stretch gap-2 pt-4">{footer}</div> : null}
      </nav>
    </div>
  )
}
