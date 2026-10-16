import { apiGet, apiPut } from "@/shared/api"

import type {
  OnslaughtAllianceProgress,
  OnslaughtProgress,
} from "../model/types"

const path = "/api/v1/me/player-data-overrides/onslaught-progress"

type OnslaughtAllianceProgressRequestDto = Pick<
  OnslaughtAllianceProgress,
  "sector" | "tier"
> | null

export type UpdateOnslaughtProgressRequestDto = {
  imperial: OnslaughtAllianceProgressRequestDto
  xenos: OnslaughtAllianceProgressRequestDto
  chaos: OnslaughtAllianceProgressRequestDto
  revision: number
}

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

export function getOnslaughtProgress(signal?: AbortSignal) {
  return apiGet<OnslaughtProgress>(path, { signal })
}

export async function updateOnslaughtProgress(progress: OnslaughtProgress) {
  return apiPut<OnslaughtProgress>(path, {
    body: mapOnslaughtProgressToRequestDto(progress),
  })
}
