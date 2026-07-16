/**
 * Converts fumadocs page trees into drawer `NavItem` nodes for site chrome.
 */

import type { NavItem } from "@limetry/ui/drawer"
import type { ReactNode } from "react"

/**
 * Minimal fumadocs page-tree node shape used for nav conversion.
 */
type PageTreeNode = {
  type: string
  name?: ReactNode
  url?: string
  index?: { url: string; name?: ReactNode }
  children?: PageTreeNode[]
}

/**
 * Flattens a ReactNode name to a string label for drawer items.
 *
 * @param name - Node title from the page tree.
 * @param fallback - Label when `name` is not a string or number.
 * @returns Display label.
 */
function nodeLabel(name: ReactNode | undefined, fallback: string): string {
  if (typeof name === "string" || typeof name === "number") {
    return String(name)
  }
  return fallback
}

/**
 * Converts fumadocs `source.pageTree` children into serializable NavItem nodes
 * for the site drawer / desktop Docs dropdown.
 *
 * @param nodes - Page tree children from fumadocs.
 * @returns Nested `\@limetry/ui/drawer` nav items (separators skipped).
 */
export function pageTreeToNavItems(nodes: PageTreeNode[]): NavItem[] {
  const items: NavItem[] = []

  for (const node of nodes) {
    if (node.type === "separator") {
      continue
    }

    if (node.type === "folder") {
      const children = pageTreeToNavItems(node.children ?? [])
      const href = node.index?.url ?? children[0]?.href ?? "/docs"
      items.push({
        href,
        label: nodeLabel(node.name, "Section"),
        children: children.length > 0 ? children : undefined,
      })
      continue
    }

    if (node.type === "page" && node.url) {
      items.push({
        href: node.url,
        label: nodeLabel(node.name, "Page"),
      })
    }
  }

  return items
}
