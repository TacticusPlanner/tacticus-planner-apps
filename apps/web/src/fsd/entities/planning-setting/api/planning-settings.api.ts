import { apiClient, unwrap } from "@/shared/api"

import type { PlanningSettingsUpdate } from "../model/types"

export function getPlanningSettings(signal?: AbortSignal) {
  return unwrap(apiClient().GET("/api/v1/settings", { signal }))
}

/** Optional fields left out keep their stored values. */
export function updatePlanningSettings(settings: PlanningSettingsUpdate) {
  return unwrap(apiClient().PUT("/api/v1/settings", { body: settings }))
}
