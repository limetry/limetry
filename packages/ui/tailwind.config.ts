/**
 * Shared Tailwind / NativeWind theme for `\@limetry/ui` and `\@limetry/app`.
 *
 * Scans this package and the Expo app sources; extends brand, surface, and
 * semantic color tokens used by the component library.
 */

// @ts-expect-error nativewind preset has no type declarations in this package
import nativewindPreset from "nativewind/preset"
import type { Config } from "tailwindcss"

/**
 * Default Tailwind config consumed by NativeWind-powered Limetry packages.
 */
const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "../app/src/**/*.{js,ts,jsx,tsx}",
  ],
  presets: [nativewindPreset],
  theme: {
    extend: {
      colors: {
        border: {
          DEFAULT: "#e2e8f0",
          dark: "#1e293b",
        },
        input: {
          DEFAULT: "#e2e8f0",
          dark: "#1e293b",
        },
        ring: {
          DEFAULT: "#10b981",
        },
        background: {
          DEFAULT: "#f8fafc",
          dark: "#070d1a",
        },
        foreground: {
          DEFAULT: "#0f172a",
          dark: "#f1f5f9",
        },
        primary: {
          DEFAULT: "#10b981",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#f1f5f9",
          foreground: "#0f172a",
          dark: "#1e293b",
          "dark-foreground": "#f1f5f9",
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#f1f5f9",
          foreground: "#64748b",
          dark: "#1e293b",
          "dark-foreground": "#94a3b8",
        },
        accent: {
          DEFAULT: "#10b981",
          foreground: "#ffffff",
        },
        card: {
          DEFAULT: "#ffffff",
          foreground: "#0f172a",
          dark: "#0d1525",
          "dark-foreground": "#f1f5f9",
        },
        brand: {
          DEFAULT: "#10b981",
          dark: "#059669",
          light: "#34d399",
        },
        surface: {
          DEFAULT: "#f8fafc",
          elevated: "#ffffff",
          border: "#e2e8f0",
          dark: "#0d1525",
          "dark-elevated": "#1e293b",
          "dark-border": "#1e293b",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
}

export default config
