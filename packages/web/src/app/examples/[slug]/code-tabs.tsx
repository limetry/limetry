"use client"

/**
 * Client tabbed code viewer for example source files.
 */

import { type CSSProperties,useState } from "react"

/**
 * One tab in the example code viewer.
 */
interface FileTab {
  label: string
  content: string
  language: string
}

type CodeWash = {
  blob: string
  ribbon: string
  blobStyle: CSSProperties
  ribbonStyle: CSSProperties
}

/**
 * Deterministic language-tinted washes — subtle shapes differ per language
 * so each example block feels distinct without hurting readability.
 */
const LANGUAGE_WASHES: Record<string, CodeWash> = {
  typescript: {
    blob: "from-sky-400/25 via-blue-300/15 to-transparent dark:from-sky-500/20 dark:via-blue-600/10",
    ribbon: "from-cyan-300/20 to-transparent dark:from-cyan-500/15",
    blobStyle: { width: 220, height: 220, borderRadius: 110, top: -80, right: -60 },
    ribbonStyle: {
      width: 280,
      height: 64,
      borderRadius: 32,
      bottom: 24,
      left: -40,
      transform: "rotate(-14deg)",
    },
  },
  python: {
    blob: "from-amber-400/25 via-yellow-300/15 to-transparent dark:from-amber-500/20 dark:via-yellow-600/10",
    ribbon: "from-orange-300/20 to-transparent dark:from-orange-500/15",
    blobStyle: { width: 180, height: 180, borderRadius: 40, top: -40, left: -50, transform: "rotate(18deg)" },
    ribbonStyle: {
      width: 200,
      height: 200,
      borderRadius: 100,
      bottom: -70,
      right: -40,
    },
  },
  json: {
    blob: "from-emerald-400/25 via-teal-300/15 to-transparent dark:from-emerald-500/20 dark:via-teal-600/10",
    ribbon: "from-lime-300/20 to-transparent dark:from-lime-500/15",
    blobStyle: {
      width: 160,
      height: 160,
      borderRadius: 80,
      top: -50,
      right: -30,
    },
    ribbonStyle: {
      width: 120,
      height: 120,
      borderRadius: 16,
      bottom: -30,
      left: 20,
      transform: "rotate(25deg)",
    },
  },
}

const DEFAULT_WASH: CodeWash = {
  blob: "from-violet-400/25 via-purple-300/15 to-transparent dark:from-violet-500/20 dark:via-purple-600/10",
  ribbon: "from-fuchsia-300/20 to-transparent dark:from-fuchsia-500/15",
  blobStyle: { width: 200, height: 120, borderRadius: 60, top: -30, right: -40, transform: "rotate(-20deg)" },
  ribbonStyle: {
    width: 90,
    height: 220,
    borderRadius: 45,
    bottom: -40,
    left: 30,
    transform: "rotate(12deg)",
  },
}

/**
 * Picks a language-tinted wash or the default palette.
 *
 * @param language - File language id from the example config.
 * @returns Wash styles for the code panel.
 */
function washForLanguage(language: string): CodeWash {
  return LANGUAGE_WASHES[language.toLowerCase()] ?? DEFAULT_WASH
}

/**
 * Tabbed source viewer with copy-to-clipboard for example files.
 *
 * @param props - File tabs to display.
 * @returns Code tabs UI.
 */
export function CodeTabs({ files }: { files: FileTab[] }): React.JSX.Element {
  const [activeIdx, setActiveIdx] = useState(0)
  const [copied, setCopied] = useState(false)
  const activeFile = files[activeIdx]

  if (!activeFile) {
    return <div className="text-sm text-muted-foreground">No code files available for this example.</div>
  }

  const wash = washForLanguage(activeFile.language)

  const handleCopy = async (): Promise<void> => {
    await navigator.clipboard.writeText(activeFile.content)
    setCopied(true)
    window.setTimeout(() => {
      setCopied(false)
    }, 1600)
  }

  return (
    <div>
      <div className="mb-4 flex gap-2 overflow-x-auto border-b border-border">
        {files.map((file, idx) => (
          <button
            key={file.label}
            type="button"
            onClick={() => {
              setActiveIdx(idx)
              setCopied(false)
            }}
            className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-semibold transition-all ${
              idx === activeIdx
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {file.label}
          </button>
        ))}
      </div>

      <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute bg-gradient-to-br ${wash.blob}`}
          style={wash.blobStyle}
        />
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute bg-gradient-to-r ${wash.ribbon}`}
          style={wash.ribbonStyle}
        />

        <div className="relative flex items-center justify-between border-b border-slate-200/90 bg-slate-100/95 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900/90">
          <span className="rounded-md bg-white px-2 py-0.5 font-mono text-xs uppercase tracking-wide text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-300">
            {activeFile.language}
          </span>
          <button
            type="button"
            onClick={() => {
              void handleCopy()
            }}
            className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        <pre className="relative max-h-[600px] overflow-x-auto p-4 text-xs leading-relaxed text-slate-800 md:text-sm dark:text-slate-200">
          <code className="font-mono">{activeFile.content}</code>
        </pre>
      </div>
    </div>
  )
}
