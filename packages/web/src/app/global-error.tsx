"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"

const ACCENTS = [
  { width: 280, top: 96, left: -110, rotate: "-18deg" },
  { width: 220, top: 420, right: -92, rotate: "22deg" },
  { width: 340, bottom: 80, left: 90, rotate: "8deg" },
  { width: 180, bottom: -62, right: 32, rotate: "-28deg" },
] as const

/**
 * Last-resort document shell when the root layout itself fails.
 */
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string }
}): React.JSX.Element {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif",
          background: "#fff",
          color: "#0f172a",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {ACCENTS.map((accent, index) => (
          <div
            key={index}
            aria-hidden
            style={{
              position: "absolute",
              width: accent.width,
              height: accent.width,
              opacity: 0.045,
              backgroundColor: "#10b981",
              transform: `rotate(${accent.rotate})`,
              WebkitMaskImage: "url(/limetry-icon.svg)",
              maskImage: "url(/limetry-icon.svg)",
              WebkitMaskSize: "contain",
              maskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
              maskPosition: "center",
              pointerEvents: "none",
              ...("top" in accent && accent.top !== undefined ? { top: accent.top } : {}),
              ...("bottom" in accent && accent.bottom !== undefined ? { bottom: accent.bottom } : {}),
              ...("left" in accent && accent.left !== undefined ? { left: accent.left } : {}),
              ...("right" in accent && accent.right !== undefined ? { right: accent.right } : {}),
            }}
          />
        ))}
        <main
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: 42 * 16,
            margin: "0 auto",
            padding: "5rem 1.5rem",
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: "ui-monospace, monospace",
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#059669",
            }}
          >
            Error
          </p>
          <h1 style={{ margin: "0.75rem 0 0", fontSize: "2rem", fontWeight: 800 }}>
            Unexpected outcome in the audit trail
          </h1>
          <p style={{ margin: "1rem 0 0", lineHeight: 1.6, opacity: 0.75 }}>
            Something tripped over its own tool call on our side. Reload the page,
            or head home. If it keeps happening, contact us with the digest below.
          </p>
          {error.digest ? (
            <pre
              style={{
                marginTop: "1.5rem",
                padding: "0.75rem 1rem",
                borderRadius: 8,
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                fontSize: 12,
                overflow: "auto",
              }}
            >
              digest: {error.digest}
            </pre>
          ) : null}
          <p style={{ margin: "2rem 0 0" }}>
            <a href="/" style={{ color: "#059669", fontWeight: 600 }}>
              Back to home
            </a>
          </p>
        </main>
      </body>
    </html>
  )
}
