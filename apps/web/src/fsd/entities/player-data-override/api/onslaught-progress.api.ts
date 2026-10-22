import { apiClient, unwrap, type ApiSchemas } from "@/shared/api"

import {
  onslaughtTiers,
  type OnslaughtAllianceProgress,
  type OnslaughtProgress,
} from "../model/types"

type S = ApiSchemas

export type UpdateOnslaughtProgressRequestDto =
  S["UpdateOnslaughtProgressRequest"]

/** An unset alliance is sent as `null` so saving never turns its placeholder into real progress. */
export function mapOnslaughtProgressToRequestDto(
  progress: OnslaughtProgress
): UpdateOnslaughtProgressRequestDto {
  const alliance = (value: OnslaughtAllianceProgress) =>
    value.isSet ? { sector: value.sector, tier: value.tier } : null
  return {
    imperial: alliance(progress.imperial),
    xenos: alliance(progress.xenos),
    chaos: alliance(progress.chaos),
    revision: progress.revision,
  }
}

/** Narrows the wire's numeric `tier` to 1–4; any other value breaks the API contract and throws. */
function mapOnslaughtProgressResponse(
  response: S["OnslaughtProgressResponse"]
): OnslaughtProgress {
  const alliance = (
    value: S["OnslaughtAllianceProgressResponse"]
  ): OnslaughtAllianceProgress => {
    const tier = onslaughtTiers.find((candidate) => candidate === value.tier)
    if (tier === undefined) {
      throw new Error(`Unexpected Onslaught tier ${value.tier}`)
    }
    return { ...value, tier }
  }
  return {
    imperial: alliance(response.imperial),
    xenos: alliance(response.xenos),
    chaos: alliance(response.chaos),
    revision: response.revision,
  }
}

const path = "/api/v1/player-data-overrides/onslaught-progress"

export async function getOnslaughtProgress(signal?: AbortSignal) {
  return mapOnslaughtProgressResponse(
    await unwrap(apiClient().GET(path, { signal }))
  )
}

export async function updateOnslaughtProgress(progress: OnslaughtProgress) {
  return mapOnslaughtProgressResponse(
    await unwrap(
      apiClient().PUT(path, {
        body: mapOnslaughtProgressToRequestDto(progress),
      })
    )
  )
}
