import { apiGet, apiPut } from "@/shared/api"

import type { OnslaughtProgress } from "../model/types"

const path = "/api/v1/me/player-data-overrides/onslaught-progress"

export function getOnslaughtProgress(signal?: AbortSignal) {
  return apiGet<OnslaughtProgress>(path, { signal })
}

export async function updateOnslaughtProgress(progress: OnslaughtProgress) {
  return apiPut<OnslaughtProgress>(path, { body: progress })
}
