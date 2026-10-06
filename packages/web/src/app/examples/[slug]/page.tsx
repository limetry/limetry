/**
 * Example detail page: loads example files from the monorepo and renders tabs.
 */

import fs from "fs"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import path from "path"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { Footer } from "@/components/footer"
import { SiteHeader } from "@/components/site-header"
import { documentTitle } from "@/lib/document-title"

import { EXAMPLES } from "../examples"
import { CodeTabs } from "./code-tabs"
import { createExampleMarkdownComponents } from "./example-markdown-components"

/**
 * Static paths for every example slug.
 *
 * @returns Param objects for `generateStaticParams`.
 */
export async function generateStaticParams() {
  return Object.keys(EXAMPLES).map((slug) => ({ slug }))
}

/**
 * Per-example metadata from {@link EXAMPLES}.
 *
 * @param props - Route params promise with `slug`.
 * @returns Next.js metadata for the example.
 */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const example = EXAMPLES[slug]
  if (!example) return { title: documentTitle("Example not found") }
  return {
    title: documentTitle(example.name),
    description: example.description,
  }
}

/**
 * Loads example sources from the monorepo and renders README plus code tabs.
 *
 * @param props - Route params promise with `slug`.
 * @returns Example detail page, or triggers `notFound`.
 */
export default async function ExampleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const example = EXAMPLES[slug]

  if (!example) {
    notFound()
  }

  // Load the content of the files from the filesystem
  const filesWithContent = example.files.map((file) => {
    // Try multiple possible paths depending on build structure
    const possiblePaths = [
      path.join(process.cwd(), "../../examples", example.folder, file.relativePath),
      path.join(process.cwd(), "examples", example.folder, file.relativePath),
      path.join(process.cwd(), "../examples", example.folder, file.relativePath),
      path.join(process.cwd(), "../..", example.folder, file.relativePath),
      path.join(process.cwd(), "..", example.folder, file.relativePath),
      path.join(process.cwd(), example.folder, file.relativePath),
    ]

    let content = ""
    for (const p of possiblePaths) {
      try {
        if (fs.existsSync(p)) {
          content = fs.readFileSync(p, "utf8")
          break
        }
      } catch (_err) {
        // Continue
      }
    }

    if (!content) {
      content = `// Could not read file ${file.relativePath} at build time.\n// Placeholder implementation.`
    }

    return {
      label: file.label,
      content,
      language: file.language,
    }
  })

  const readmeFile = filesWithContent.find((f) => f.label === "README" || f.language === "markdown")
  const readmeContent = readmeFile && !readmeFile.content.startsWith("// Could not read")
    ? readmeFile.content
    : null

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Link
              href="/examples"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              ← Back to all examples
            </Link>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
                {example.name}
              </h1>
              <span className="rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {example.framework}
              </span>
              <span className="rounded-lg border border-border bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                {example.lang}
              </span>
              <span className="rounded-lg border border-border bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                {example.maturity}
              </span>
              <span className="rounded-lg border border-border bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                {example.tested ? "automated tests" : "schema / manual"}
              </span>
            </div>
            <p className="mt-3 text-lg text-muted-foreground max-w-3xl leading-relaxed">
              {example.description}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Source folder:{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                {example.folder.startsWith("archive/") ? example.folder : `examples/${example.folder}`}
              </code>
            </p>
          </div>

          {readmeContent ? (
            <section className="mb-12 rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
              <div className="mb-4 pb-3 border-b border-border flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">Documentation & Guide</h2>
                <span className="text-xs text-muted-foreground">README.md</span>
              </div>
              <article className="prose max-w-none prose-headings:tracking-tight prose-h1:text-2xl prose-h2:text-xl prose-h2:border-b prose-h2:border-border prose-h2:pb-2 prose-a:text-primary dark:prose-invert">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={createExampleMarkdownComponents(example.folder)}
                >
                  {readmeContent}
                </ReactMarkdown>
              </article>
            </section>
          ) : null}

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight text-foreground">Source Files</h2>
              <span className="text-xs text-muted-foreground">
                {filesWithContent.length} files in{" "}
                <code>{example.folder.startsWith("archive/") ? example.folder : `examples/${example.folder}`}</code>
              </span>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <CodeTabs files={filesWithContent} />
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
