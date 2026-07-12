/**
 * Catch-all fumadocs MDX page for `/docs/*`.
 */

import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/page"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { docsMdxComponents } from "@/lib/docs-mdx-components"
import { source } from "@/lib/source"

/**
 * App Router props for the docs catch-all route.
 */
interface PageProps {
  params: Promise<{ slug?: string[] }>
}

/**
 * Renders one fumadocs MDX page.
 *
 * @param props - Optional slug segments under `/docs`.
 * @returns Docs page body, or triggers `notFound`.
 */
export default async function Page({ params }: PageProps): Promise<React.JSX.Element> {
  const { slug } = await params
  const page = source.getPage(slug ?? [])
  if (!page) notFound()

  const MDX = page.data.body

  return (
    <DocsPage toc={page.data.toc}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDX components={docsMdxComponents} />
      </DocsBody>
    </DocsPage>
  )
}

/**
 * Static paths for all docs pages.
 *
 * @returns Slug param lists from fumadocs.
 */
export async function generateStaticParams(): Promise<{ slug: string[] }[]> {
  return source.generateParams()
}

/**
 * Docs page metadata from fumadocs frontmatter.
 *
 * @param props - Optional slug segments.
 * @returns Title/description Open Graph metadata.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const page = source.getPage(slug ?? [])
  if (!page) notFound()

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      title: page.data.title,
      description: page.data.description,
    },
  }
}
