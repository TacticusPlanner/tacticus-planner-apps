import { apiClient, unwrap } from "@/shared/api"

import type { IncursionProgressOverrides } from "../model/types"

export function getIncursionProgressOverrides(signal?: AbortSignal) {
  return unwrap(
    apiClient().GET("/api/v1/player-data-overrides/incursions-progress", {
      signal,
    })
  )
}

export function updateIncursionProgressOverrides(
  progress: IncursionProgressOverrides
) {
  return unwrap(
    apiClient().PUT("/api/v1/player-data-overrides/incursions-progress", {
      body: progress,
    })
  )
}
