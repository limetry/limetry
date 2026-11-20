/**
 * Compact branded HTML for browser-facing Ask Limetry 404 / 500 responses.
 */

export type StatusHtmlKind = "not-found" | "error"

/**
 * Renders a themed status document for limetry.org `/api*` misses and faults.
 *
 * @param kind - 404 vs unexpected error.
 * @param path - Request path shown to the user when present.
 * @returns Full HTML document.
 */
export function renderAskApiStatusHtml(kind: StatusHtmlKind, path?: string): string {
  const isNotFound = kind === "not-found"
  const code = isNotFound ? "404" : "500"
  const title = isNotFound
    ? "Endpoint not in the policy catalog"
    : "Unexpected outcome in the audit trail"
  const lead = isNotFound
    ? "We evaluated this path against the Ask Limetry / contact API surface. "
      + "Verdict: DENY. Reason: no matching route under /api on limetry.org."
    : "Something tripped over its own tool call while handling this request. "
      + "This is our fault, not a policy deny from your rules."
  const hint = isNotFound
    ? "Use POST /api/assistant or POST /api/contact, check /api/assistant/docs, "
      + "or open limetry.org. API clients receive JSON { \"error\": \"not_found\" }."
    : "Retry shortly, or contact hello@limetry.com with the path and time."
  const pathBlock = path
    ? `<p style="margin-top:1.5rem;padding:0.75rem 1rem;border-radius:0.5rem;border:1px solid #e2e8f0;font-family:ui-monospace,monospace;font-size:12px;color:#64748b;word-break:break-all">Requested: ${escapeHtml(path)}</p>`
    : ""

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Limetry API — ${code}</title>
<meta name="robots" content="noindex"/>
<style>
body{margin:0;min-height:100vh;font-family:Geist,ui-sans-serif,system-ui,sans-serif;background:#fff;color:#0f172a;line-height:1.5}
.wrap{max-width:42rem;margin:0 auto;padding:5rem 1.25rem;position:relative;z-index:1}
.code{margin:0;font-family:ui-monospace,monospace;font-size:14px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:#059669}
h1{margin:.75rem 0 0;font-size:2rem;font-weight:800;letter-spacing:-.03em}
p{margin:1rem 0 0;color:#64748b}
.actions{display:flex;flex-wrap:wrap;gap:.75rem;margin-top:2.5rem}
a.btn{display:inline-flex;align-items:center;border-radius:.5rem;padding:.625rem 1rem;font-size:.875rem;font-weight:600;text-decoration:none}
a.primary{background:#059669;color:#fff}
a.ghost{border:1px solid #e2e8f0;color:#0f172a}
.accent{position:fixed;opacity:.045;background:#10b981;-webkit-mask:url(/limetry-icon.svg) center/contain no-repeat;mask:url(/limetry-icon.svg) center/contain no-repeat;pointer-events:none}
</style>
</head>
<body>
<div class="accent" style="width:280px;height:280px;top:96px;left:-110px;transform:rotate(-18deg)" aria-hidden="true"></div>
<div class="accent" style="width:220px;height:220px;top:420px;right:-92px;transform:rotate(22deg)" aria-hidden="true"></div>
<main class="wrap">
<p class="code">${code}</p>
<h1>${title}</h1>
<p>${lead}</p>
<p>${hint}</p>
${pathBlock}
<div class="actions">
<a class="btn primary" href="/">Back to limetry.org</a>
<a class="btn ghost" href="/api/assistant/docs">API docs</a>
<a class="btn ghost" href="/contact">Contact</a>
</div>
</main>
</body>
</html>`
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
}

/**
 * True when the client prefers HTML over JSON.
 */
export function prefersHtml(acceptHeader: string | undefined): boolean {
  if (!acceptHeader) {
    return false
  }
  const accept = acceptHeader.toLowerCase()
  const html = accept.indexOf("text/html")
  if (html < 0) {
    return false
  }
  const json = accept.indexOf("application/json")
  if (json < 0) {
    return true
  }
  return html < json
}
