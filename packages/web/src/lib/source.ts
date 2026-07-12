/**
 * Fumadocs page loader for marketing-site documentation under `/docs`.
 */

import { loader } from "fumadocs-core/source"
import { toFumadocsSource } from "fumadocs-mdx/runtime/server"

import { docs, meta } from "@/.source/server"

/**
 * Fumadocs source loader rooted at `/docs`.
 */
export const source = loader({
  baseUrl: "/docs",
  source: toFumadocsSource(docs, meta),
})
