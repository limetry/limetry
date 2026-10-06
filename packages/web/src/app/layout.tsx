/**
 * Root layout for `\@limetry/web`: fonts, metadata, and fumadocs provider.
 */

import "./globals.css"

import { RootProvider } from "fumadocs-ui/provider/next"
import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import type { ReactNode } from "react"

import { ChunkLoadRecovery } from "@/components/chunk-load-recovery"
import { PostHogProvider } from "@/components/posthog-provider"
import { SentryInit } from "@/components/sentry-init"
import { siteUrls } from "@/lib/site-urls"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
})

/**
 * Default document metadata for limetry.com.
 */
export const metadata: Metadata = {
  title: {
    default: "Limetry — Agent Action Governance",
    template: "Limetry — %s",
  },
  description:
    "Open-source policy engine for AI agent tool calls. Evaluate, allow, deny, or wait — then audit outcomes. Self-run with MCP and CLI.",
  metadataBase: new URL(siteUrls.web),
  keywords: [
    "AI agent governance",
    "agent action policy",
    "tool call evaluation",
    "audit trail",
    "MCP server",
    "autonomous agents",
    "policy engine",
    "Agent action governance",
  ],
  authors: [{ name: "Limetry" }],
  creator: "Limetry",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrls.web,
    siteName: "Limetry",
    title: "Limetry — Agent Action Governance",
    description:
      "Open-source policy engine for AI agent tool calls. Evaluate, allow, deny, or wait — then audit outcomes.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Limetry — Agent Action Governance",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Limetry — Agent Action Governance",
    description: "Open-source policy engine for AI agent tool calls. Evaluate, allow, deny, or wait — then audit.",
    images: ["/og.png"],
    creator: "@limetry",
  },
  robots: {
    index: true,
    follow: true,
  },
}

/**
 * HTML shell with fonts, chunk recovery, and fumadocs RootProvider.
 *
 * @param props - App router children.
 * @returns Root html/body tree.
 */
export default function RootLayout({ children }: { children: ReactNode }): React.JSX.Element {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${jetBrainsMono.variable}`}>
      <body>
        <SentryInit />
        <ChunkLoadRecovery />
        <PostHogProvider>
          <RootProvider search={{ enabled: false }}>{children}</RootProvider>
        </PostHogProvider>
      </body>
    </html>
  )
}
