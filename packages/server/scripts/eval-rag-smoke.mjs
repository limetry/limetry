/**
 * Citation smoke checks against a running Limetry API (`POST /v1/chat`).
 *
 * Usage: node scripts/eval-rag-smoke.mjs [baseUrl]
 */

const baseUrl = (process.argv[2] || "http://127.0.0.1:3810").replace(/\/$/, "")

const questions = [
  "How do I get started with the Limetry SDK?",
  "How do I self-host the Limetry server?",
  "Explain Limetry architecture at a high level",
  "What does data minimization mean for audit?",
  "How does policy evaluate work over HTTP?",
]

let failures = 0

for (const message of questions) {
  const response = await fetch(`${baseUrl}/v1/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message }),
  })
  const body = await response.json().catch(() => ({}))
  const sources = Array.isArray(body.sources) ? body.sources : []
  const ok = response.ok && body.ok && Boolean(body.answer) && sources.length > 0
  console.log(
    ok ? "PASS" : "FAIL",
    response.status,
    sources.length,
    message.slice(0, 48),
  )
  if (!ok) {
    failures += 1
    console.error(body)
  }
}

if (failures > 0) {
  console.error(`eval-rag-smoke: ${failures} failure(s)`)
  process.exit(1)
}

console.log("eval-rag-smoke: all questions returned citations")
