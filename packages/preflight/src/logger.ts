/**
 * Pino logger factory for preflight banners with pretty or JSON stdout writers.
 */

import pino, { type Logger } from "pino"

import { isTestEnv } from "./env-runtime.js"

/**
 * Subset of a Pino JSON log record used by the pretty writer.
 */
type PreflightLogRecord = {
  level?: number | string
  msg?: string
  preflightBanner?: boolean
}

/**
 * Writes banner text as plain stdout; other records as JSON or message-only.
 *
 * @param chunk - Serialized Pino log line (usually JSON).
 * @param jsonMode - When true, emit raw JSON for non-banner records.
 * @returns Nothing; writes to `process.stdout`.
 */
function writePretty(chunk: string, jsonMode: boolean): void {
  try {
    const record = JSON.parse(chunk) as PreflightLogRecord
    if (record.preflightBanner && typeof record.msg === "string") {
      process.stdout.write(`${record.msg}\n`)
      return
    }
    if (jsonMode) {
      process.stdout.write(chunk.endsWith("\n") ? chunk : `${chunk}\n`)
      return
    }
    if (typeof record.msg === "string") {
      process.stdout.write(`${record.msg}\n`)
      return
    }
  } catch {
    process.stdout.write(chunk.endsWith("\n") ? chunk : `${chunk}\n`)
    return
  }
  process.stdout.write(chunk.endsWith("\n") ? chunk : `${chunk}\n`)
}

/**
 * Pino logger for preflight banners. Disabled in test; JSON when production + non-TTY.
 *
 * @param product - Product display name used in logger `name` and `base.product`.
 * @param source - Injected env bag for `NODE_ENV` / `LOG_LEVEL` (not ambient re-reads).
 * @returns Configured Pino {@link Logger}, or a disabled logger in test env.
 */
export function createPreflightLogger(
  product: string,
  source: NodeJS.ProcessEnv = process.env,
): Logger {
  if (isTestEnv(source)) {
    return pino({ enabled: false })
  }
  const jsonMode = source.NODE_ENV === "production" && !process.stdout.isTTY
  const name = `${product.toLowerCase().replace(/\s+/g, "-")}.preflight`
  return pino({
    name,
    level: source.LOG_LEVEL ?? "info",
    base: { product },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level(label) {
        return { level: label }
      },
    },
  }, {
    write(chunk: string) {
      writePretty(chunk, jsonMode)
    },
  })
}

export type { Logger }
