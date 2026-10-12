/**
 * Limetry logo and decorative icon accents for marketing chrome.
 */

/**
 * Shared className prop for brand mark components.
 */
interface BrandProps {
  className?: string
}

/**
 * Limetry wordmark: brand icon plus gradient logo text (#21b263 → #27A1D2).
 *
 * @param props - Optional Tailwind `className` override on the outer span.
 * @returns Wordmark mark.
 */
export function Logo({ className = "h-8 shrink-0" }: BrandProps): React.JSX.Element {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`} role="img" aria-label="Limetry">
      {/* eslint-disable-next-line @next/next/no-img-element -- intentional static SVG */}
      <img
        src="/limetry-icon.svg"
        alt=""
        aria-hidden="true"
        className="h-8 w-8 shrink-0"
      />
      <span className="bg-linear-to-r from-[#21b263] to-[#27A1D2] bg-clip-text text-[1.35rem] font-bold tracking-tight text-transparent">
        Limetry
      </span>
    </span>
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
    // eslint-disable-next-line @next/next/no-img-element -- intentional static SVG
    <img
      src="/limetry-icon.svg"
      alt=""
      aria-hidden="true"
      className={`pointer-events-none absolute select-none ${className}`}
    />
  )
}
