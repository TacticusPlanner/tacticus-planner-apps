import { apiGet, apiPut } from "@/shared/api"

import type { PlanningSettings } from "../model/types"

export function getPlanningSettings(signal?: AbortSignal) {
  return apiGet<PlanningSettings>("/api/v1/me/user-settings", { signal })
}

export async function updatePlanningSettings(settings: PlanningSettings) {
  return apiPut<PlanningSettings>("/api/v1/me/user-settings", {
    body: settings,
  })
}
