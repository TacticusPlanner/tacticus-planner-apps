import { apiClient, unwrap } from "@/shared/api"

import type { BattleProgressOverrides } from "../model/types"

export function getBattleProgressOverrides(signal?: AbortSignal) {
  return unwrap(
    apiClient().GET("/api/v1/player-data-overrides/battle-progress", {
      signal,
    })
  )
}

export function updateBattleProgressOverrides(
  progress: BattleProgressOverrides
) {
  return unwrap(
    apiClient().PUT("/api/v1/player-data-overrides/battle-progress", {
      body: progress,
    })
  )
}
