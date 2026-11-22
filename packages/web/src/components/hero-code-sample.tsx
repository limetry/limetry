"use client"

/**
 * Hero evaluate snippet with TypeScript / Python toggle.
 */

import { useState } from "react"

const TS_CODE = `import { createRemoteEngine } from "@limetry/sdk"

const engine = createRemoteEngine({
  baseUrl: process.env.LIMETRY_BASE_URL,
  apiKey: process.env.LIMETRY_BEARER_TOKEN,
})

const decision = await engine.evaluateAction({
  intent_id: crypto.randomUUID(),
  policy_id: policyId,
  agent_id: "ci-bot",
  action_type: "deploy",
  resource: "github.com/acme/api@abc123",
  issued_at: new Date().toISOString(),
})

if (!decision.ok || !decision.approved) {
  throw new Error((decision.reasons ?? ["denied"]).join("; "))
}`

const PY_CODE = `from limetry import create_remote_engine
import uuid
from datetime import datetime, timezone

engine = create_remote_engine()
decision = engine.evaluate_action({
  "intent_id": str(uuid.uuid4()),
  "policy_id": policy_id,
  "agent_id": "ci-bot",
  "action_type": "deploy",
  "resource": "github.com/acme/api@abc123",
  "issued_at": datetime.now(timezone.utc).isoformat(),
})

if not decision.get("ok") or not decision.get("approved"):
  raise RuntimeError("; ".join(decision.get("reasons") or ["denied"]))`

/**
 * Renders the hero evaluate code sample with a language toggle.
 *
 * @returns Code sample panel.
 */
export function HeroCodeSample(): React.JSX.Element {
  const [lang, setLang] = useState<"typescript" | "python">("typescript")
  const code = lang === "typescript" ? TS_CODE : PY_CODE
  const filename = lang === "typescript" ? "evaluate.ts" : "evaluate.py"

  return (
    <div className="
      mx-auto mt-14 max-w-2xl overflow-hidden rounded-2xl border border-border bg-card
      shadow-2xl shadow-black/10
    ">
      <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-3">
        <span className="size-3 rounded-full bg-red-400" />
        <span className="size-3 rounded-full bg-yellow-400" />
        <span className="size-3 rounded-full bg-green-400" />
        <span className="ml-3 font-mono text-xs text-muted-foreground">{filename}</span>
        <div className="ml-auto flex gap-1">
          <button
            type="button"
            onClick={() => setLang("typescript")}
            className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
              lang === "typescript"
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            TypeScript
          </button>
          <button
            type="button"
            onClick={() => setLang("python")}
            className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
              lang === "python"
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Python
          </button>
        </div>
      </div>
      <pre className="overflow-x-auto border-none bg-transparent p-5 text-left text-sm/relaxed">
        <code className="text-foreground/90">{code}</code>
      </pre>
    </div>
  )
}
