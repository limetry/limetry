/**
 * Document title for the pricing redirect route.
 */

import type { Metadata } from "next"
import type { ReactNode } from "react"

import { documentTitle } from "@/lib/document-title"

/** Browser title while the pricing route redirects. */
export const metadata: Metadata = {
  title: documentTitle("Pricing"),
}

/**
 * Passes the pricing page through with branded document metadata.
 *
 * @param props - Pricing route children.
 * @returns The child route.
 */
export default function PricingLayout({ children }: { children: ReactNode }): ReactNode {
  return children
}
