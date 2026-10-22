import { apiClient, unwrap } from "@/shared/api"

import type { CampaignEventProgressOverrides } from "../model/types"

export function getCampaignEventProgressOverrides(signal?: AbortSignal) {
  return unwrap(
    apiClient().GET("/api/v1/player-data-overrides/campaign-events-progress", {
      signal,
    })
  )
}

export function updateCampaignEventProgressOverrides(
  progress: CampaignEventProgressOverrides
) {
  return unwrap(
    apiClient().PUT("/api/v1/player-data-overrides/campaign-events-progress", {
      body: progress,
    })
  )
}
