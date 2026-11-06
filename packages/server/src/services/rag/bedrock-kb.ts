/**
 * Amazon Bedrock Knowledge Bases retrieve / RetrieveAndGenerate adapters.
 *
 * Optional AWS showcase path (`LIMETRY_RAG_BACKEND=bedrock-kb`).
 */

import type { ServerEnv } from "../../env.js"
import type { RagChatResponse, RagSource } from "./types.js"

/**
 * Retrieves passages from a Bedrock Knowledge Base.
 *
 * @param env - Server env with KB id.
 * @param query - User question.
 * @returns Citation sources.
 */
export async function retrieveBedrockKnowledgeBase(
  env: ServerEnv,
  query: string,
): Promise<RagSource[]> {
  if (!env.LIMETRY_BEDROCK_KB_ID) {
    return []
  }
  const { BedrockAgentRuntimeClient, RetrieveCommand } = await import(
    "@aws-sdk/client-bedrock-agent-runtime"
  )
  const region = env.LIMETRY_BEDROCK_REGION || process.env.AWS_REGION || "us-east-1"
  const client = new BedrockAgentRuntimeClient({ region })
  const result = await client.send(new RetrieveCommand({
    knowledgeBaseId: env.LIMETRY_BEDROCK_KB_ID,
    retrievalQuery: { text: query },
    retrievalConfiguration: {
      vectorSearchConfiguration: { numberOfResults: 6 },
    },
  }))
  return (result.retrievalResults ?? []).map((row, index) => {
    const text = row.content?.text ?? ""
    const location = row.location?.s3Location?.uri
      ?? row.location?.webLocation?.url
      ?? "bedrock-kb"
    return {
      id: `bedrock-${index}`,
      title: location.split("/").pop() ?? "source",
      sourcePath: location,
      snippet: text.slice(0, 500),
      score: row.score ?? 0,
    } satisfies RagSource
  })
}

/**
 * Uses Bedrock RetrieveAndGenerate for a grounded answer + citations.
 *
 * @param env - Server env.
 * @param query - User question.
 * @returns Chat response or null when KB/model not configured.
 */
export async function retrieveAndGenerateBedrock(
  env: ServerEnv,
  query: string,
): Promise<RagChatResponse | null> {
  if (!env.LIMETRY_BEDROCK_KB_ID) {
    return null
  }
  const modelArn = env.LIMETRY_BEDROCK_MODEL_ARN
    || env.LIMETRY_BEDROCK_MODEL_ID
  if (!modelArn) {
    return null
  }
  const { BedrockAgentRuntimeClient, RetrieveAndGenerateCommand } = await import(
    "@aws-sdk/client-bedrock-agent-runtime"
  )
  const region = env.LIMETRY_BEDROCK_REGION || process.env.AWS_REGION || "us-east-1"
  const client = new BedrockAgentRuntimeClient({ region })
  const modelArnResolved = modelArn.includes("arn:")
    ? modelArn
    : `arn:aws:bedrock:${region}::foundation-model/${modelArn}`

  const input: {
    input: { text: string }
    retrieveAndGenerateConfiguration: {
      type: "KNOWLEDGE_BASE"
      knowledgeBaseConfiguration: {
        knowledgeBaseId: string
        modelArn: string
        generationConfiguration?: {
          guardrailConfiguration?: {
            guardrailId: string
            guardrailVersion: string
          }
        }
      }
    }
  } = {
    input: { text: query },
    retrieveAndGenerateConfiguration: {
      type: "KNOWLEDGE_BASE",
      knowledgeBaseConfiguration: {
        knowledgeBaseId: env.LIMETRY_BEDROCK_KB_ID,
        modelArn: modelArnResolved,
      },
    },
  }

  if (env.LIMETRY_BEDROCK_GUARDRAIL_ID) {
    input.retrieveAndGenerateConfiguration.knowledgeBaseConfiguration.generationConfiguration = {
      guardrailConfiguration: {
        guardrailId: env.LIMETRY_BEDROCK_GUARDRAIL_ID,
        guardrailVersion: env.LIMETRY_BEDROCK_GUARDRAIL_VERSION || "DRAFT",
      },
    }
  }

  const result = await client.send(new RetrieveAndGenerateCommand(input))
  const sources: RagSource[] = (result.citations ?? []).flatMap((citation, citationIndex) => (
    (citation.retrievedReferences ?? []).map((ref, refIndex) => {
      const text = ref.content?.text ?? ""
      const location = ref.location?.s3Location?.uri
        ?? ref.location?.webLocation?.url
        ?? "bedrock-kb"
      return {
        id: `cite-${citationIndex}-${refIndex}`,
        title: location.split("/").pop() ?? "source",
        sourcePath: location,
        snippet: text.slice(0, 500),
        score: 1,
      } satisfies RagSource
    })
  ))

  return {
    answer: result.output?.text ?? "",
    sources,
    backend: "bedrock-kb",
    model: modelArn,
  }
}
