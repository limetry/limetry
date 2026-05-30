# OpenAI agent procurement governance

Govern OpenAI SDK tool calls with Limetry action policy before a purchase, provision,
or HTTP side effect runs.

## Flow

1. **Policy** — an `ActionPolicy` sets allowed types, resource allow/deny lists, spend caps,
   and audit mode.
2. **Intent** — before the tool runs, the app drafts an `ActionIntent` (type, resource, optional cost).
3. **Evaluate** — Limetry returns `allow`, `deny`, or `approval_required`.
4. **Minimize** — `createSlimActionPolicy({ auditMode: "minimal" })` and `redactActionIntent`
   keep credentials out of local logs; the server also scrubs before audit storage.

## Code structure

- `src/action-governance.ts`: Exports `buildProcurementActionPolicy()`, `buildPurchaseIntent()`, and privacy redaction helpers.
- `tests/action-governance.spec.ts`: Automated tests verifying policy creation, intent generation, and local log scrubbing.

## Tests

```bash
yarn workspace @examples/openai-agent-procurement-governance test
```
