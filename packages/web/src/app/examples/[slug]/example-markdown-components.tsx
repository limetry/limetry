/**
 * ReactMarkdown link renderer for example README content on the marketing site.
 */

import type { ReactNode } from "react"
import type { Components } from "react-markdown"

import { resolveExampleMarkdownHref } from "@/lib/example-markdown-links"

type ExampleMarkdownAnchorProps = {
  href?: string
  children?: ReactNode
  className?: string
  title?: string
}

/**
 * Builds ReactMarkdown component overrides that rewrite repo-relative links.
 *
 * @param exampleFolder - Catalog `folder` for the example being rendered.
 * @returns Partial `components` map for ReactMarkdown.
 */
export function createExampleMarkdownComponents(exampleFolder: string): Components {
  function ExampleMarkdownAnchor({
    href,
    children,
    className,
    title,
  }: ExampleMarkdownAnchorProps): React.JSX.Element {
    const resolved = resolveExampleMarkdownHref(href, exampleFolder)

    if (resolved.type === "plain") {
      return (
        <span className={className ?? "font-mono text-[0.9em]"} title={title}>
          {children}
        </span>
      )
    }

    return (
      <a
        href={resolved.href}
        className={className}
        title={title}
        {...(resolved.external
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
      >
        {children}
      </a>
    )
  }

  return {
    a: ExampleMarkdownAnchor,
  }
}
