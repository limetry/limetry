/**
 * Fumadocs MDX source config — docs content under `content/docs`.
 */

import { defineConfig,defineDocs } from "fumadocs-mdx/config"

/**
 * Fumadocs content collections for the docs directory.
 */
export const { docs, meta } = defineDocs({
  dir: "content/docs",
})

/**
 * Default fumadocs MDX pipeline configuration.
 */
export default defineConfig()
