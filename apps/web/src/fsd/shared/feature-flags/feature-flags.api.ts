import type { ApiSchemas } from "@/shared/api"
import { getRequiredEnvironmentValue } from "@/shared/config"

type FeatureFlagsDto = ApiSchemas["FeatureFlagsResponse"]

/**
 * Names of the flags the API reports as on. Anonymous on purpose: flags gate
 * signed-out pages too, and the shared `apiClient` always attaches a token.
 */
export async function fetchEnabledFeatureFlags(
  signal?: AbortSignal
): Promise<string[]> {
  const response = await fetch(
    new URL(
      "/api/v1/feature-flags",
      getRequiredEnvironmentValue("VITE_API_BASE_URL")
    ),
    { signal }
  )
  if (!response.ok) {
    throw new Error(
      `Feature flags request failed with status ${response.status}.`
    )
  }
  const body = (await response.json()) as FeatureFlagsDto
  return [...body.enabled]
}
