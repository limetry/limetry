/**
 * Blog index listing engineering posts newest-first.
 */

import type { Metadata } from "next"
import Link from "next/link"

import { IconAccent } from "@/components/brand"
import { Footer } from "@/components/footer"
import { SiteHeader } from "@/components/site-header"

import { BLOG_POSTS } from "./posts"

/**
 * Blog index SEO metadata.
 */
export const metadata: Metadata = {
  title: "Blog — Limetry",
  description: "Release notes, tutorials, and engineering stories from the Limetry team.",
}

const TAG_COLORS: Record<string, string> = {
  Launch: "bg-primary/10 text-primary border-primary/20",
  Engineering: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  SDK: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  MCP: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  Integrations: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  Security: "bg-red-500/10 text-red-400 border-red-500/20",
}

/**
 * Lists blog posts newest-first.
 *
 * @returns Blog index layout.
 */
export default function BlogPage(): React.JSX.Element {
  // Sort posts chronologically descending
  const sortedPosts = [...BLOG_POSTS].sort((a, b) => b.dateRaw.localeCompare(a.dateRaw))

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="relative flex-1 overflow-hidden py-16 sm:py-24">
        <IconAccent className="-left-48 top-32 h-[460px] w-[460px] opacity-[0.05] -rotate-6" />
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">Blog</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
              Stories from the Limetry team
            </h1>
            <p className="mt-3 text-muted-foreground">
              Release notes, engineering deep-dives, and community stories.
            </p>
          </div>

          <div className="flex flex-col gap-8">
            {sortedPosts.map((post) => (
              <article
                key={post.slug}
                className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
              >
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`rounded-lg border px-2.5 py-0.5 text-xs font-semibold ${
                        TAG_COLORS[tag] ?? "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                  <span className="text-xs text-muted-foreground ml-auto">{post.readTime}</span>
                </div>
                <Link href={`/blog/${post.slug}`} className="block">
                  <h2 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                    {post.title}
                  </h2>
                </Link>
                <p className="mt-2 text-sm text-muted-foreground">{post.date}</p>
                <p className="mt-3 text-muted-foreground leading-relaxed">{post.description}</p>
                <Link
                  href={`/blog/${post.slug}`}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  Read more
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
