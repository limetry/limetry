/**
 * System prompts and answer assembly for Limetry docs RAG.
 */

import type { RagSource } from "./types.js"

/** Base system instructions for grounded Limetry docs answers. */
export const RAG_SYSTEM_PROMPT = `You are the Limetry documentation assistant.
Answer only using the provided source excerpts.
If the sources are insufficient, say you do not know and suggest which doc area to check.
Never invent install commands, secrets, endpoints, or architecture details.
Always cite source paths inline like [source: path].
Focus on helping users learn how to use, deploy, and understand Limetry securely.`

/**
 * Formats retrieved sources into a context block for the model.
 *
 * @param sources - Ranked evidence.
 * @returns Context string.
 */
export function formatContext(sources: RagSource[]): string {
  if (sources.length === 0) {
    return "(no sources retrieved)"
  }
  return sources.map((source, index) => (
    `[#${index + 1} ${source.sourcePath}${source.section ? ` · ${source.section}` : ""}]\n${source.snippet}`
  )).join("\n\n")
}

/**
 * Builds a grounded fallback answer when no LLM provider is configured.
 *
 * @param message - User question.
 * @param sources - Retrieved chunks.
 * @returns Extractive answer text.
 */
export function extractiveAnswer(message: string, sources: RagSource[]): string {
  if (sources.length === 0) {
    return [
      "I could not find matching Limetry documentation for that question.",
      "Try asking about quick start, self-hosting, evaluate API, or data minimization.",
      "Run `yarn workspace @limetry/server rag:ingest` if the corpus has not been built yet.",
    ].join(" ")
  }
  const lines = [
    `Based on Limetry docs related to “${message.trim()}”:`,
    "",
    ...sources.slice(0, 3).map((source, index) => (
      `${index + 1}. [${source.sourcePath}] ${source.snippet.slice(0, 280).replace(/\s+/g, " ")}…`
    )),
    "",
    "Configure OPENAI_API_KEY, ANTHROPIC_API_KEY, or Bedrock to get synthesized answers with the same citations.",
  ]
  return lines.join("\n")
}
