# AWS baseline for Limetry docs RAG

Best-effort Bedrock guidance (outside SageMaker skill validated workflows).

## Region

Use a Bedrock-supported region with Claude + Titan Embed access (commonly
`us-east-1` or `us-west-2`). Set `AWS_REGION` / `LIMETRY_BEDROCK_REGION`.

## Enable models (Bedrock console → Model access)

- **Chat**: Anthropic Claude (Sonnet-class or current equivalent)
- **Embeddings**: Amazon Titan Embed Text v2 (or current Titan Embed model)

Do **not** rely on Titan Text Express + LangChain `RetrievalQA` for production.

## S3 corpus bucket

1. Create a private bucket (e.g. `limetry-docs-rag-<account>`).
2. Upload ingest output under `corpus/` (markdown/text chunks or synced MDX export).
3. Grant the Knowledge Base service role `s3:GetObject` / `ListBucket` on that prefix.

## Knowledge Base + S3 Vectors

1. Create a Bedrock Knowledge Base.
2. Data source: S3 corpus prefix.
3. Vector store: **Amazon S3 Vectors** (preferred for small / sparse QPS — $0 compute floor).
4. Avoid classic OpenSearch Serverless “Quick create” for this workload (~$175–350/mo idle).
5. Run sync after each corpus publish.
6. Record the Knowledge Base ID as `LIMETRY_BEDROCK_KB_ID`.

## Guardrails

Create a Bedrock Guardrail that:

- Requires grounding to retrieved content where possible
- Denies requests for secrets, API keys, and credential fabrication
- Blocks instructions to invent Limetry deploy steps not present in sources

Set `LIMETRY_BEDROCK_GUARDRAIL_ID` and `LIMETRY_BEDROCK_GUARDRAIL_VERSION` (or `DRAFT`).

## IAM (least privilege)

Runtime role (Lambda / task role) needs approximately:

- `bedrock:Retrieve` / `bedrock:RetrieveAndGenerate` on the Knowledge Base
- `bedrock:InvokeModel` / `bedrock:Converse` on the chat + embed model ARNs
- `bedrock:ApplyGuardrail` on the Guardrail ARN
- S3 read only if the app also serves corpus files directly

Avoid `bedrock:*`.

## Env vars (server)

| Variable | Purpose |
|----------|---------|
| `LIMETRY_RAG_BACKEND` | `memory` (default) \| `pgvector` \| `bedrock-kb` |
| `LIMETRY_RAG_CORPUS_PATH` | Path to ingest JSON (memory backend) |
| `LIMETRY_BEDROCK_KB_ID` | Knowledge Base id |
| `LIMETRY_BEDROCK_MODEL_ID` | Claude model id for Converse / RetrieveAndGenerate |
| `LIMETRY_BEDROCK_EMBED_MODEL_ID` | Titan Embed model id |
| `LIMETRY_BEDROCK_GUARDRAIL_ID` | Optional Guardrail id |
| `LIMETRY_BEDROCK_REGION` | Overrides `AWS_REGION` for Bedrock clients |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` | Portable AI SDK providers (non-AWS clouds) |
| `LIMETRY_RAG_CHAT_PUBLIC` | `true` to allow unauthenticated chat (rate-limited) |

## Cost expectation (small scale)

With S3 Vectors + sparse queries, vector storage/request charges stay near pennies
per month for a docs corpus. Model tokens dominate variable cost. Classic
OpenSearch Serverless floors are inappropriate for this project’s expected QPS.
