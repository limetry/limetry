"use client"

/**
 * Legacy `/docs/ask` → docs home with the floating chat opened.
 */

import { useRouter } from "next/navigation"
import { useEffect } from "react"

/**
 * Keeps old Ask docs links working by opening the floating assistant.
 *
 * @returns Null while redirecting.
 */
export default function DocsAskPage(): null {
  const router = useRouter()

  useEffect(() => {
    router.replace("/docs/introduction?ask=1")
  }, [router])

  return null
}
