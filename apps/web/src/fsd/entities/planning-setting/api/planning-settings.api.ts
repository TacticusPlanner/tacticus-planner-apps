import { apiClient, unwrap } from "@/shared/api"

import type { PlanningSettings } from "../model/types"

export function getPlanningSettings(signal?: AbortSignal) {
  return unwrap(apiClient().GET("/api/v1/settings", { signal }))
}

export function updatePlanningSettings(settings: PlanningSettings) {
  return unwrap(apiClient().PUT("/api/v1/settings", { body: settings }))
}
