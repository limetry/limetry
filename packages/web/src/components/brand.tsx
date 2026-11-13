/**
 * Limetry logo and decorative icon accents for marketing chrome.
 */

/**
 * Shared className prop for brand mark components.
 */
import { Logo as SharedLogo } from "@limetry/ui/logo"

interface BrandProps {
  className?: string
}

/**
 * Limetry wordmark: brand icon plus gradient logo text (#21b263 → #27A1D2).
 *
 * @param props - Optional Tailwind `className` override on the outer span.
 * @returns Wordmark mark.
 */
export const Logo = SharedLogo

/**
 * Decorative brand icon used as a subtle page background accent.
 *
 * @param props - Optional positioning / opacity classes.
 * @returns Decorative icon image.
 */
export function IconAccent({ className = "" }: BrandProps): React.JSX.Element {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- intentional static SVG
    <img
      src="/limetry-icon.svg"
      alt=""
      aria-hidden="true"
      className={`pointer-events-none absolute select-none ${className}`}
    />
  )
}
