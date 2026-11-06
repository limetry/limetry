/**
 * `/docs/ask` — conversational Limetry documentation assistant.
 */

import type { Metadata } from "next"

import { DocsAskChat } from "@/components/docs-ask-chat"
import { Footer } from "@/components/footer"
import { SiteHeader } from "@/components/site-header"

export const metadata: Metadata = {
  title: "Ask Limetry docs",
  description: "Conversational Q&A over Limetry documentation with cited sources.",
}

/**
 * Docs RAG chat page.
 *
 * @returns Ask UI with site chrome.
 */
export default function DocsAskPage(): React.JSX.Element {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
        <header className="mb-8 max-w-2xl">
          <p className="font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-[var(--text-muted)]">
            Documentation assistant
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--text-main)]">
            Ask Limetry docs
          </h1>
          <p className="mt-2 text-[var(--text-secondary)]">
            Learn how to use, deploy, and understand Limetry. Answers are grounded in the
            open-source docs corpus (portable AI SDK / optional Amazon Bedrock Knowledge Bases).
          </p>
        </header>
        <DocsAskChat />
      </main>
      <Footer />
    </div>
  )
}
