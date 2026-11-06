# Limetry docs RAG assistant

Conversational Q&A over Limetry open-source documentation.

## Paths

| Mode | Env | Notes |
|------|-----|--------|
| **memory** (default) | `LIMETRY_RAG_BACKEND=memory` | Local JSON corpus + extractive or AI SDK answers |
| **pgvector** | `LIMETRY_RAG_BACKEND=pgvector` | Portable multi-cloud via Postgres |
| **bedrock-kb** | `LIMETRY_RAG_BACKEND=bedrock-kb` | AWS showcase: Knowledge Bases + S3 Vectors |

## Quick start

```bash
yarn workspace @limetry/server rag:ingest
yarn workspace @limetry/server dev
# UI: yarn workspace @limetry/web dev → http://localhost:…/docs/ask
```

Generated artifacts under `corpus/` (`rag-corpus.json`, `plain/`) are gitignored —
rebuild locally or in deploy before enabling the memory backend or S3 KB sync.

See [AWS_BASELINE.md](./AWS_BASELINE.md), [EVAL.md](./EVAL.md), and
[specs/limetry_docs_rag_use_case_spec.md](./specs/limetry_docs_rag_use_case_spec.md).
