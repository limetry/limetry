/**
 * Citation + conversational-quality smoke checks against Ask Limetry.
 *
 * Usage: node scripts/eval-assistant-smoke.mjs [baseUrl]
 * Default baseUrl is the local assistant HTTP server (port 3815).
 */

const baseUrl = (process.argv[2] || "http://127.0.0.1:3815").replace(/\/$/, "")

const questions = [
  "How do I get started with the Limetry SDK?",
  "How do I self-host the Limetry server?",
  "Explain Limetry architecture at a high level",
  "What does data minimization mean for audit?",
  "How does policy evaluate work over HTTP?",
]

const banned = [
  /Based on Limetry docs related to/i,
  /## Tools\s*\|/,
  /\[!NOTE\]/,
  /\bchunk-\d+\b/i,
]

let failures = 0

for (const message of questions) {
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message }),
  })
  const body = await response.json().catch(() => ({}))
  const sources = Array.isArray(body.sources) ? body.sources : []
  const answer = typeof body.answer === "string" ? body.answer : ""
  const leak = banned.find((pattern) => pattern.test(answer))
  const ok = response.ok
    && body.ok
    && Boolean(answer)
    && sources.length > 0
    && !leak
  console.log(
    ok ? "PASS" : "FAIL",
    response.status,
    sources.length,
    leak ? `leak=${leak}` : "clean",
    message.slice(0, 48),
  )
  if (!ok) {
    failures += 1
    console.error(body)
  }
}

if (failures > 0) {
  console.error(`eval-assistant-smoke: ${failures} failure(s)`)
  process.exit(1)
}

console.log("eval-assistant-smoke: all questions returned clean cited answers")
