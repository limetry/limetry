/**
 * React Native drawer panel for Expo / mobile consumers.
 *
 * Presented as a modal so menu presses are not lost under the page overlay.
 * Re-exports navigation helpers used by host apps.
 */

import { useState } from "react"
import { Modal, Pressable, StyleSheet, Text, View } from "react-native"

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
 * Docs sidebar width used as the drawer floor on larger phones.
 * Matches fumadocs `--fd-sidebar-width: 286px`.
 */
const DOCS_SIDEBAR_WIDTH = 286

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
}: DrawerItemProps): React.JSX.Element {
  const hasChildren = Boolean(item.children && item.children.length > 0)
  const branchActive = isNavItemOrChildActive(pathname, item)
  const highlighted = isItemHighlighted(pathname, item, activeHref)
  const ancestorActive = branchActive && !highlighted
  const [expanded, setExpanded] = useState(branchActive)

  if (hasChildren && item.children) {
    const open = expanded || branchActive
    return (
      <View className="gap-0.5">
        <View className="flex-row items-stretch gap-1">
          <LinkComponent href={item.href} onPress={onNavigate}>
            <View
              className={cn(
                "relative mb-1 min-h-11 flex-1 flex-row items-center justify-start gap-3 rounded-xl px-3 py-2.5",
                highlighted
                  ? "bg-emerald-500/15"
                  : "",
              )}
            >
              {highlighted && depth > 0 ? (
                <View
                  className="absolute bottom-1.5 top-1.5 w-px bg-emerald-500"
                  style={{ left: -9 }}
                />
              ) : null}
              {item.icon && renderIcon ? renderIcon(item.icon, highlighted) : null}
              <Text
                className={cn(
                  "text-left text-sm font-medium",
                  highlighted
                    ? "text-emerald-500"
                    : ancestorActive
                      ? "font-semibold text-slate-900 dark:text-slate-100"
                      : "text-slate-600 dark:text-slate-400",
                )}
              >
                {item.label}
              </Text>
            </View>
          </LinkComponent>
          <Pressable
            accessibilityLabel={open ? `Collapse ${item.label}` : `Expand ${item.label}`}
            accessibilityRole="button"
            onPress={() => {
              setExpanded((value) => !value)
            }}
            className="min-h-11 min-w-11 items-center justify-center rounded-xl px-2.5 active:bg-slate-100 dark:active:bg-slate-800"
          >
            <Text className={cn("text-slate-500", (ancestorActive || highlighted) && "text-emerald-500")}>
              {open ? "▾" : "▸"}
            </Text>
          </Pressable>
        </View>
        {open ? (
          <View className="ml-3 border-l border-slate-200 pl-2 dark:border-slate-700">
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
          </View>
        ) : null}
      </View>
    )
  }

  return (
    <LinkComponent href={item.href} onPress={onNavigate}>
      <View
        className={cn(
          "relative mb-1 min-h-11 flex-row items-center justify-start gap-3 rounded-xl px-3 py-2.5",
          highlighted ? "bg-emerald-500/15" : "",
        )}
      >
        {highlighted && depth > 0 ? (
          <View
            className="absolute bottom-1.5 top-1.5 w-px bg-emerald-500"
            style={{ left: -9 }}
          />
        ) : null}
        {item.icon && renderIcon ? renderIcon(item.icon, highlighted) : null}
        <Text
          className={cn(
            "text-left text-sm font-medium",
            depth > 0 && "text-[13px]",
            highlighted ? "text-emerald-500" : "text-slate-600 dark:text-slate-400",
          )}
        >
          {item.label}
        </Text>
      </View>
    </LinkComponent>
  )
}

/**
 * React Native drawer panel for Expo / mobile consumers.
 *
 * The panel is a modal so its rows are not covered by the page overlay, and the
 * host header is rendered inside that modal so logo, profile, and close stay pressable.
 *
 * @param props - Open state, nav items, pathname, and injected link/icon renderers.
 * @returns The drawer modal when open, otherwise `null`.
 */
export function DrawerMenu({
  open,
  onOpenChange,
  items,
  pathname,
  LinkComponent,
  renderIcon,
  footer,
  topOffset = 0,
  className,
  header,
}: DrawerMenuProps): React.JSX.Element | null {
  if (!open) {
    return null
  }

  const activeHref = findActiveNavHref(pathname, items)

  const closeDrawer = (): void => {
    onOpenChange(false)
  }

  return (
    <Modal
      animationType="fade"
      onRequestClose={closeDrawer}
      transparent
      visible
    >
      <View className="flex-1">
        {header ?? <View style={{ height: topOffset }} />}
        <View className="flex-1 flex-row justify-end">
          <Pressable
            accessibilityLabel="Close navigation menu"
            accessibilityRole="button"
            onPress={closeDrawer}
            style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(15, 23, 42, 0.5)" }]}
          />
          <View
            className={cn(
              "h-full border-l border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900",
              className,
            )}
            style={{ width: "80%", maxWidth: DOCS_SIDEBAR_WIDTH, zIndex: 1 }}
          >
            <View className="flex-1 gap-1">
              {items.map((item) => (
                <DrawerNavItem
                  key={`${item.href}-${item.label}`}
                  item={item}
                  pathname={pathname}
                  activeHref={activeHref}
                  depth={0}
                  LinkComponent={LinkComponent}
                  renderIcon={renderIcon}
                  onNavigate={closeDrawer}
                />
              ))}
            </View>
            {footer ? <View className="mt-auto items-stretch gap-2 pt-4">{footer}</View> : null}
          </View>
        </View>
      </View>
    </Modal>
  )
}
