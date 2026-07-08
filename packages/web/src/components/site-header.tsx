/**
 * Server wrapper that injects the live docs tree into the client site header.
 */

import { pageTreeToNavItems } from "@/lib/docs-nav"
import { source } from "@/lib/source"

import { Nav } from "./nav"

/**
 * Server wrapper that injects the live docs tree into the client site header.
 *
 * @returns Client {@link Nav} with docs children from fumadocs.
 */
export function SiteHeader(): React.JSX.Element {
  const docsChildren = pageTreeToNavItems(
    source.pageTree.children as Parameters<typeof pageTreeToNavItems>[0],
  )

  return <Nav docsChildren={docsChildren} />
}
