# Plan

1. ✅ **Use-case spec** — Document deploy-base / Bedrock / portable AI SDK intent.
2. ✅ **AWS baseline** — Region, models, S3, Guardrails, IAM notes.
3. ✅ **Corpus ingest** — Chunk docs → JSON corpus (+ plain/ for S3 KB sync).
4. ✅ **Bedrock KB API** — Optional `LIMETRY_RAG_BACKEND=bedrock-kb` chat path.
5. ✅ **AI SDK portable** — Default `memory`/`pgvector` chat with provider switch.
6. ✅ **Web chat UI** — `/docs/ask` UI with citations.
7. ✅ **Cloud wiring** — Pulumi `buildServerEnvironment` RAG secrets.
8. ✅ **Eval smoke** — Citation question set + cost notes.
