import { apiGet, apiPut } from "@/shared/api"

import type { CampaignEventProgressOverrides } from "../model/types"

const path = "/api/v1/me/player-data-overrides/campaign-events-progress"

export function getCampaignEventProgressOverrides(signal?: AbortSignal) {
  return apiGet<CampaignEventProgressOverrides>(path, { signal })
}

export function updateCampaignEventProgressOverrides(
  progress: CampaignEventProgressOverrides
) {
  return apiPut<CampaignEventProgressOverrides>(path, { body: progress })
}
