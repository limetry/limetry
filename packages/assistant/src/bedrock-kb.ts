/**
 * Amazon Bedrock Knowledge Bases retrieve / RetrieveAndGenerate adapters.
 *
 * Optional AWS showcase path (`LIMETRY_ASSISTANT_BACKEND=bedrock-kb`).
 */

import type { AssistantEnv } from "./env.js"
import { bedrockRegion } from "./bedrock-converse.js"
import type { AssistantChatResponse, AssistantSource } from "./types.js"

/**
 * Retrieves passages from a Bedrock Knowledge Base.
 *
 * @param env - Assistant env with KB id.
 * @param query - User question.
 * @returns Citation sources.
 */
export async function retrieveBedrockKnowledgeBase(
  env: AssistantEnv,
  query: string,
): Promise<AssistantSource[]> {
  if (!env.LIMETRY_BEDROCK_KB_ID) {
    return []
  }
  const { BedrockAgentRuntimeClient, RetrieveCommand } = await import(
    "@aws-sdk/client-bedrock-agent-runtime"
  )
  const region = bedrockRegion(env)
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
    } satisfies AssistantSource
  })
}

/**
 * Uses Bedrock RetrieveAndGenerate for a grounded answer + citations.
 *
 * @param env - Assistant env.
 * @param query - User question.
 * @returns Chat response or null when KB/model not configured.
 */
export async function retrieveAndGenerateBedrock(
  env: AssistantEnv,
  query: string,
): Promise<AssistantChatResponse | null> {
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
  const region = bedrockRegion(env)
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
  const sources: AssistantSource[] = (result.citations ?? []).flatMap((citation, citationIndex) => (
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
      } satisfies AssistantSource
    })
  ))

  return {
    answer: result.output?.text ?? "",
    sources,
    backend: "bedrock-kb",
    model: modelArn,
  }
}
