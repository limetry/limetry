/**
 * Limetry logo and decorative icon accents for marketing chrome.
 */

import Image from "next/image"

/**
 * Shared className prop for brand mark components.
 */
interface BrandProps {
  className?: string
}

/**
 * Full Limetry wordmark (icon + text) rendered from the brand PNG.
 *
 * @param props - Optional Tailwind `className` override.
 * @returns Logo image.
 */
export function Logo({ className = "h-8 w-auto shrink-0 object-contain" }: BrandProps): React.JSX.Element {
  return (
    <Image
      src="/limetry-logo.png"
      alt="Limetry"
      width={280}
      height={80}
      priority
      className={className}
    />
  )
}

/**
 * Decorative brand icon used as a subtle page background accent.
 *
 * @param props - Optional positioning / opacity classes.
 * @returns Decorative icon image.
 */
export function IconAccent({ className = "" }: BrandProps): React.JSX.Element {
  return (
    // Decorative static SVG; next/image adds no benefit for aria-hidden accents.
    // eslint-disable-next-line @next/next/no-img-element -- intentional static SVG
    <img
      src="/limetry-icon.svg"
      alt=""
      aria-hidden="true"
      className={`pointer-events-none absolute select-none ${className}`}
    />
  )
}
