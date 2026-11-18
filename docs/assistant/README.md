# Ask Limetry product assistant

Conversational Q&A over Limetry open-source documentation.

## Paths

| Mode | Env | Notes |
|------|-----|--------|
| **memory** (default) | `LIMETRY_ASSISTANT_BACKEND=memory` | Local JSON corpus + extractive or AI SDK answers |
| **pgvector** | `LIMETRY_ASSISTANT_BACKEND=pgvector` | Portable multi-cloud via Postgres |
| **bedrock-kb** | `LIMETRY_ASSISTANT_BACKEND=bedrock-kb` | AWS showcase: Knowledge Bases + S3 Vectors |

## Quick start

```bash
yarn workspace @limetry/server assistant:ingest
yarn workspace @limetry/server dev
# UI: yarn workspace @limetry/web dev → floating Ask button (lower right), or ?ask=1
```

Generated artifacts under `corpus/` (`assistant-corpus.json`, `plain/`) are gitignored —
rebuild locally or in deploy before enabling the memory backend or S3 KB sync.

See [AWS_BASELINE.md](./AWS_BASELINE.md), [EVAL.md](./EVAL.md), and
[specs/limetry_assistant_use_case_spec.md](./specs/limetry_assistant_use_case_spec.md).
