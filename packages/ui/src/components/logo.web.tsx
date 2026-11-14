import type { JSX } from "react"

import { cn } from "../lib/cn"

export type LogoVariant = "wordmark" | "mark" | "product"

export type LogoProps = {
  /** Public icon URL. */
  iconSrc?: string
  /** Optional full white product logo used by operator chrome. */
  productSrc?: string
  /** Render only the icon mark. */
  variant?: LogoVariant
  /** Tailwind classes applied to the outer logo. */
  className?: string
  /** Accessible label for the mark. */
  label?: string
}

/** Shared Limetry web logo with a self-contained gradient wordmark. */
export function Logo({
  iconSrc = "/limetry-icon.svg",
  productSrc = "/limetry-logo-white.png",
  variant = "wordmark",
  className,
  label = "Limetry",
}: LogoProps): JSX.Element {
  if (variant === "product") {
    return (
      <img
        src={productSrc}
        alt={label}
        className={cn("h-7 w-auto object-contain", className)}
      />
    )
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2",
        variant === "mark" ? "h-8 w-8" : "h-8",
        className,
      )}
      role="img"
      aria-label={label}
    >
      <img
        src={iconSrc}
        alt=""
        aria-hidden="true"
        className="h-8 w-8 shrink-0 object-contain"
      />
      {variant === "wordmark" ? (
        <span className="bg-linear-to-r from-[#21b263] to-[#27A1D2] bg-clip-text font-sans text-[1.35rem] font-bold tracking-tight text-transparent">
          Limetry
        </span>
      ) : null}
    </span>
  )
}
