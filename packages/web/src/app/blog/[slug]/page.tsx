/**
 * Individual blog post route rendered from in-repo markdown content.
 */

import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { Footer } from "@/components/footer"
import { SiteHeader } from "@/components/site-header"
import { documentTitle } from "@/lib/document-title"
import { siteUrls } from "@/lib/site-urls"

import { BLOG_POSTS } from "../posts"

/**
 * Static paths for every in-repo blog slug.
 *
 * @returns Param objects for `generateStaticParams`.
 */
export async function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({
    slug: post.slug,
  }))
}

/**
 * Per-post metadata from {@link BLOG_POSTS}.
 *
 * @param props - Route params promise with `slug`.
 * @returns Next.js metadata for the post.
 */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = BLOG_POSTS.find((p) => p.slug === slug)
  if (!post) return { title: documentTitle("Post not found") }
  return {
    title: documentTitle(post.title),
    description: post.description,
  }
}

/**
 * Renders one blog post as markdown.
 *
 * @param props - Route params promise with `slug`.
 * @returns Post page, or triggers `notFound`.
 */
export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = BLOG_POSTS.find((p) => p.slug === slug)

  if (!post) {
    notFound()
    return null
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              ← Back to blog
            </Link>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary"
                >
                  {tag}
                </span>
              ))}
              <span className="text-xs text-muted-foreground ml-auto">{post.readTime}</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{post.date}</p>
          </div>

          <article className="prose max-w-none prose-headings:tracking-tight prose-h1:text-3xl prose-h2:border-b prose-h2:border-border prose-h2:pb-2 prose-a:text-primary">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
          </article>

          <div className="mt-12 rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center">
            <h3 className="text-lg font-bold text-foreground">Run Limetry on your own stack</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Self-host the open source evaluation server, wire evaluate into your agents, and keep
              privacy-safe audit under your control.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/docs/quick-start"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90"
              >
                Quick start
              </Link>
              <Link
                href={siteUrls.github}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition-all hover:border-primary/40"
              >
                View on GitHub
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
