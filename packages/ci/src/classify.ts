/**
 * GitHub Actions event trust classification for CI privilege gating.
 *
 * Distinguishes trusted workflow triggers (push, release, workflow_dispatch)
 * from untrusted fork/PR-adjacent events that must not receive privileged secrets.
 */

/**
 * Whether a GitHub Actions event is trusted for privileged secrets.
 */
export type EventTrust = "trusted" | "untrusted"

/**
 * GitHub event names treated as untrusted for privileged CI.
 */
const UNTRUSTED_EVENTS = new Set([
  "pull_request",
  "pull_request_target",
  "pull_request_review",
  "pull_request_review_comment",
  "issues",
  "issue_comment",
  "workflow_run",
])

/**
 * Classify whether a GitHub Actions event should receive privileged secrets.
 *
 * Returns `untrusted` for known PR/issue/workflow_run events, pull refs, and
 * any unrecognized event name. Only `push`, `release`, and `workflow_dispatch`
 * are trusted.
 *
 * @param input - Event name and optional git ref from the workflow context.
 * @returns `"trusted"` or `"untrusted"`.
 */
export function classifyEventTrust(input: {
  eventName: string
  ref?: string
}): EventTrust {
  const eventName = input.eventName.trim().toLowerCase()
  if (UNTRUSTED_EVENTS.has(eventName)) {
    return "untrusted"
  }
  if (eventName === "push" || eventName === "release" || eventName === "workflow_dispatch") {
    return "trusted"
  }
  if (input.ref?.startsWith("refs/pull/")) {
    return "untrusted"
  }
  return "untrusted"
}
