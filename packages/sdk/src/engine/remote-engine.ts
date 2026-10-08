/**
 * HTTPS {@link RemotePolicyEngine} that delegates action evaluation to a Limetry server.
 *
 * Posts intents to `/v1/policy/evaluate` with a Bearer API key. Use
 * {@link createRemoteEngine} to construct an instance from environment variables.
 */

import { EngineLoadError } from "../errors.js"
import type {
  ActionEvaluationResponse,
  ActionIntent,
} from "../types.js"
import { resolveLimetryBaseUrl } from "../urls.js"

/**
 * Construction options for {@link RemotePolicyEngine}.
 */
export type RemotePolicyEngineOptions = {
  /**
   * Base URL of the Limetry server.
   * Defaults to the production OSS API: https://api.limetry.org
   */
  baseUrl?: string
  /**
   * API key (Bearer token). Generate one with `limetry setup` or from the portal.
   * For self-hosted servers this is your LIMETRY_BEARER_TOKEN value.
   */
  apiKey: string
  /**
   * Tenant id for server-authoritative policy evaluation.
   */
  tenantId?: string
  /**
   * Optional fetch override for test mocking or custom transports.
   */
  fetch?: typeof globalThis.fetch
}

/**
 * Posts a JSON body to a Limetry API URL with Bearer authentication.
 *
 * @param fetcher - `fetch` implementation to use.
 * @param url - Absolute request URL.
 * @param apiKey - Bearer token value.
 * @param body - JSON-serializable request body.
 * @returns Parsed JSON response body.
 * @throws {@link EngineLoadError} when the HTTP response is not OK.
 */
async function doFetch(
  fetcher: typeof globalThis.fetch,
  url: string,
  apiKey: string,
  body: unknown,
): Promise<unknown> {
  const response = await fetcher(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => `HTTP ${response.status}`)
    throw new EngineLoadError(`Limetry remote engine error (${response.status}): ${text}`)
  }

  return response.json()
}

/**
 * Policy engine that delegates ActionIntent evaluation to a Limetry server over HTTPS.
 */
export class RemotePolicyEngine {
  private readonly baseUrl: string
  private readonly apiKey: string
  private readonly tenantId: string
  private readonly fetcher: typeof globalThis.fetch

  /**
   * Creates a remote engine from explicit connection options.
   *
   * Trailing slashes are stripped from `baseUrl`. `tenantId` defaults to
   * `"default"`. `fetch` defaults to `globalThis.fetch`.
   *
   * @param options - Connection and auth options.
   * @throws {@link EngineLoadError} when no `fetch` implementation is available.
   */
  constructor(options: RemotePolicyEngineOptions) {
    this.baseUrl = resolveLimetryBaseUrl(process.env, options.baseUrl)
    this.apiKey = options.apiKey
    this.tenantId = options.tenantId ?? "default"
    this.fetcher = options.fetch ?? globalThis.fetch

    if (!this.fetcher) {
      throw new EngineLoadError(
        "RemotePolicyEngine requires a global fetch implementation. " +
        "Use Node 18+ or pass a fetch polyfill via options.fetch.",
      )
    }
  }

  /**
   * Evaluates an {@link ActionIntent} via `POST /v1/policy/evaluate`.
   *
   * @param intent - Action intent to evaluate; `policy_id` is sent alongside the body.
   * @returns Server {@link ActionEvaluationResponse} (cast from JSON).
   * @throws {@link EngineLoadError} when the HTTP call fails or returns a non-OK status.
   */
  async evaluateAction(intent: ActionIntent): Promise<ActionEvaluationResponse> {
    const result = await doFetch(
      this.fetcher,
      `${this.baseUrl}/v1/policy/evaluate`,
      this.apiKey,
      {
        tenant_id: this.tenantId,
        policy_id: intent.policy_id,
        intent,
      },
    )
    return result as ActionEvaluationResponse
  }
}

/**
 * Creates a {@link RemotePolicyEngine} using config from the environment.
 *
 * Resolves `apiKey` from `overrides.apiKey`, then `LIMETRY_API_KEY`, then
 * `LIMETRY_BEARER_TOKEN`. Resolves `baseUrl` from `overrides.baseUrl`, then
 * `LIMETRY_BASE_URL`, then the hosted default.
 *
 * @param overrides - Optional partial options merged over environment defaults.
 * @returns Configured {@link RemotePolicyEngine}.
 * @throws {@link EngineLoadError} when no API key can be resolved.
 */
export function createRemoteEngine(overrides?: Partial<RemotePolicyEngineOptions>): RemotePolicyEngine {
  const apiKey =
    overrides?.apiKey ??
    process.env.LIMETRY_API_KEY ??
    process.env.LIMETRY_BEARER_TOKEN

  if (!apiKey) {
    throw new EngineLoadError(
      "No Limetry API key found. Set LIMETRY_API_KEY or run `limetry setup`.",
    )
  }

  return new RemotePolicyEngine({
    baseUrl: resolveLimetryBaseUrl(process.env, overrides?.baseUrl),
    apiKey,
    ...overrides,
  })
}
