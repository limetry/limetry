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

/** Fixed placements that read as randomly scattered screened logos. */
const PAGE_BRAND_ACCENTS = [
  { width: 280, top: 96, left: -110, rotate: "-18deg" },
  { width: 220, top: 420, right: -92, rotate: "22deg" },
  { width: 340, bottom: 80, left: 90, rotate: "8deg" },
  { width: 180, bottom: -62, right: 32, rotate: "-28deg" },
] as const

/**
 * Full-page screened logo background (same treatment as Cloud marketing / shells).
 */
export function PageBrandBackground(): React.JSX.Element {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {PAGE_BRAND_ACCENTS.map((accent, index) => (
        <div
          key={index}
          className="absolute bg-[#10b981] opacity-[0.045] dark:bg-[#34d399] dark:opacity-[0.035]"
          style={{
            width: accent.width,
            height: accent.width,
            transform: `rotate(${accent.rotate})`,
            top: "top" in accent ? accent.top : undefined,
            bottom: "bottom" in accent ? accent.bottom : undefined,
            left: "left" in accent ? accent.left : undefined,
            right: "right" in accent ? accent.right : undefined,
            maskImage: "url(/limetry-icon.svg)",
            WebkitMaskImage: "url(/limetry-icon.svg)",
            maskSize: "contain",
            WebkitMaskSize: "contain",
            maskRepeat: "no-repeat",
            WebkitMaskRepeat: "no-repeat",
            maskPosition: "center",
            WebkitMaskPosition: "center",
          }}
        />
      ))}
    </div>
  )
}
