# Docs RAG evaluation smoke set

Run against a live server with a built corpus:

```bash
yarn workspace @limetry/server rag:ingest
# start API, then:
yarn workspace @limetry/server rag:eval
# or:
curl -s http://localhost:3810/v1/chat -H 'content-type: application/json' \
  -d '{"message":"How do I self-host Limetry?"}' | jq .
```

## Required questions (expect citations)

| # | Question | Must cite something like |
|---|----------|---------------------------|
| 1 | How do I get started with the Limetry SDK? | `USAGE.md`, `quick-start`, `packages/sdk/README` |
| 2 | How do I self-host the Limetry server? | `INSTALL.md`, `self-hosting` |
| 3 | Explain Limetry architecture at a high level | `architecture` docs / README |
| 4 | What does data minimization mean for audit? | `SECURITY.md`, `data-minimization` |
| 5 | How does policy evaluate work over HTTP? | `openapi.yaml`, evaluate routes |

Pass criteria for memory backend without LLM keys: HTTP 200, `sources.length > 0`, answer non-empty.
With Bedrock/OpenAI/Anthropic configured: answer synthesizes sources and still returns `sources`.

## Cost notes (small scale)

- Prefer `LIMETRY_RAG_BACKEND=memory` or `pgvector` for OSS default.
- AWS showcase: Bedrock Knowledge Bases + **S3 Vectors** (~pennies storage/request at low QPS).
- Avoid classic OpenSearch Serverless quick-create idle floors (~$175–350/mo).
