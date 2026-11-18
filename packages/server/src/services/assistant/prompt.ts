/**
 * System prompts and answer assembly for Limetry product assistant chat.
 */

import type { AssistantSource } from "./types.js"

/** Conversational product-assistant instructions grounded in retrieved sources. */
export const ASSISTANT_SYSTEM_PROMPT = `You are Ask Limetry, a conversational product specialist for Limetry (open-source) and Limetry Cloud (enterprise).

Behave like a capable AI chat assistant customers expect from ChatGPT or Claude — warm, clear, and helpful — while staying strictly scoped to Limetry products.

Reply structure (always):
1. Start with a short conversational summary that directly answers the question (2–4 sentences).
2. Then add practical guidance, steps, caveats, or OSS vs Cloud distinctions when useful.
3. End with one relevant follow-up question when it would help the user go deeper (skip when the answer is complete or the user only needed a definition).

Grounding rules:
- Use the provided source excerpts as evidence. Prefer synthesizing and explaining over quoting.
- Paraphrase tables, callouts, and markdown chrome into clean prose or simple markdown lists.
- Never invent install commands, secrets, endpoints, APIs, pricing, or architecture details.
- If sources are insufficient, say so plainly and suggest what to ask next or which product area to check.
- Never mention chunks, embeddings, retrieval backends, or that you are pasting documentation.
- Cite evidence with compact markdown links or bracket refs like [1], [2] matching the numbered sources. Do not dump raw file paths as the main answer body.
- Prefer human titles over repository paths when referring to docs.`

/**
 * Formats retrieved sources into a context block for the model.
 *
 * @param sources - Ranked evidence.
 * @returns Context string.
 */
export function formatContext(sources: AssistantSource[]): string {
  if (sources.length === 0) {
    return "(no sources retrieved)"
  }
  return sources.map((source, index) => {
    const product = source.product ? ` · ${source.product}` : ""
    const section = source.section && !/^chunk-\d+$/i.test(source.section)
      ? ` · ${source.section}`
      : ""
    const href = source.href ? `\nurl: ${source.href}` : ""
    return (
      `[#${index + 1} ${source.title}${product}${section}]\npath: ${source.sourcePath}${href}\n${source.snippet}`
    )
  }).join("\n\n")
}

/**
 * Builds a short human fallback when synthesis is unavailable.
 *
 * Never pastes raw corpus snippets (avoids markdown leak and mid-token truncation).
 *
 * @param _message - User question (reserved for future personalization).
 * @param sources - Retrieved evidence (used only to decide empty vs soft-fail copy).
 * @returns Conversational fallback text without source body dumps.
 */
export function extractiveAnswer(
  _message: string,
  sources: AssistantSource[],
): string {
  if (sources.length === 0) {
    return [
      "I could not find matching Limetry documentation for that yet.",
      "Try asking about quick start, self-hosting, evaluate API, Limetry Cloud deployment, or data minimization.",
    ].join(" ")
  }
  return [
    "I found relevant Limetry docs, but I could not synthesize a full answer right now.",
    "Please try again in a moment, or ask a more specific question — for example how to self-host, how evaluate works, or what data minimization means in Limetry.",
    "Want a quick overview of getting started with the SDK?",
  ].join(" ")
}

/**
 * Returns true when the answer text matches the legacy extractive dump template.
 *
 * @param answer - Assistant answer body.
 * @returns Whether the answer looks like the old regurgitation format.
 */
export function isLegacyExtractiveTemplate(answer: string): boolean {
  return /Based on Limetry docs related to/i.test(answer)
}
