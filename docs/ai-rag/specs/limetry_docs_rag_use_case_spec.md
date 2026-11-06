# Use Case Specification

## Intent

Deploy base model (no fine-tuning)

## Business Problem

Give Limetry OSS users a conversational Q&A assistant over product documentation
(use, deploy, architecture, security) with cited sources, while exemplifying a
modern small-scale Amazon Bedrock RAG architecture and a portable Vercel AI SDK
path for AWS/GCP/Azure via `packages/cloud`.

## Primary Users

- Developers evaluating or self-hosting Limetry
- Maintainers demonstrating AWS AI / multi-cloud AI patterns

## Deployment Constraints

- **Task**: conversational RAG chatbot over documentation
- **Data type**: text (MDX, Markdown, OpenAPI)
- **Size preference**: cost-sensitive at small / sparse QPS
- **Deployment target**: Amazon Bedrock on AWS; portable AI SDK providers on GCP/Azure
- **Context window**: long documentation excerpts with citations
- **Languages**: English
- **Model type**: managed foundation models (Bedrock Claude / Anthropic / OpenAI)
- **Recency**: latest available Bedrock Claude + Titan Embed (or provider equivalents)

## Architecture choices (locked)

- **AWS showcase**: Bedrock Knowledge Bases + S3 Vectors + Guardrails
- **Default portable product path**: AI SDK + pgvector (or in-memory corpus) via `@limetry/server` `POST /v1/chat`
- **UI**: `@limetry/web` `/docs/ask`
