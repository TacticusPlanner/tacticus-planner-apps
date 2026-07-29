import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useIsAuthenticated } from "@azure/msal-react"
import { useLiveQuery } from "dexie-react-hooks"
import { unitIdSchema, type UnitId } from "@workspace/game-domain"
import { getOnslaughtRewards } from "@workspace/game-catalog/queries"
import {
  getInventoryShard,
  getInventoryUpgrades,
  getLiveProgress,
  getPlayerCharacter,
  getPlayerMow,
} from "@workspace/player-data/queries"

import { goalQueries } from "@/entities/goal"
import { onslaughtProgressQueries } from "@/entities/player-data-override"
import { usePlanningSettings } from "@/entities/planning-setting"
import { useCampaignDisplay } from "@/shared/lib"

import type { EstimateOutcome } from ".//estimate.domain"
import { computePlanInsights } from "../insights/plan-insights-calc"
import { useGoalCatalog } from "../shared/use-goal-catalog"

// Mirrors use-plan-insights.ts's own gate — a completed/archived goal has no live estimate to show.
const ACTIVE_STATUSES = new Set(["Draft", "Active", "Paused"])

type FetchState =
  | { status: "idle" }
  | { status: "success"; key: string; estimate: EstimateOutcome | undefined }

/**
 * A single goal's isolated estimate (a "plan of one" — no priority sharing with other goals, unlike
 * `usePlanInsights`) for contexts with no single project to scope a shared plan to — the cross-project
 * Goals page's detail sheet. `projects-page.tsx` instead uses `usePlanInsights`'s real per-project
 * estimate, since there priority-sharing across the project's other goals is exactly what's wanted.
 * Reuses `computePlanInsights` unchanged: fed a single-goal `details` array, it already produces the
 * correct isolated number (nothing else to share priority/inventory with), so this is purely a
 * smaller batch-fetch shell around the same pure calc `usePlanInsights` uses, mirroring its shape but
 * scoped to one entity instead of a project's members.
 */
export function useGoalEstimate(goalId: string | null) {
  const isAuthenticated = useIsAuthenticated()
  const {
    upgradesById,
    battlesById,
    charactersById,
    mowsById,
    ascensionCostsById,
    unlockShardCostsById,
    releaseTypeByGroupId,
    getCharacter,
  } = useGoalCatalog()
  const { name: campaignName, fullLabel: campaignFullLabel } =
    useCampaignDisplay()
  const inventoryUpgrades = useLiveQuery(() => getInventoryUpgrades(), [])
  const liveProgress = useLiveQuery(() => getLiveProgress(), [])
  const onslaughtRewards = useLiveQuery(() => getOnslaughtRewards(), [])
  const { settings: planningSettings } = usePlanningSettings()

  const detailQuery = useQuery({
    ...goalQueries.detail(goalId ?? "unselected"),
    enabled: Boolean(isAuthenticated && goalId),
  })
  const detail = detailQuery.data
  const onslaughtProgressQuery = useQuery({
    ...onslaughtProgressQueries.current(),
    enabled: Boolean(isAuthenticated && goalId),
  })

  const [fetchState, setFetchState] = useState<FetchState>({ status: "idle" })

  const isActive = !!detail && ACTIVE_STATUSES.has(detail.status)
  const hasQuery = Boolean(goalId && isAuthenticated && isActive)
  const catalogReady =
    !!charactersById &&
    !!mowsById &&
    !!onslaughtRewards &&
    !!ascensionCostsById &&
    !!unlockShardCostsById
  const serverDataReady =
    detailQuery.isSuccess && onslaughtProgressQuery.isSuccess
  const key = `${goalId}:${detail?.updatedAt}`

  useEffect(() => {
    if (!hasQuery || !catalogReady || !serverDataReady || !detail) {
      return undefined
    }

    let active = true
    const entityId = unitIdSchema.parse(detail.entityId) as UnitId
    const onslaughtProgress = onslaughtProgressQuery.data

    void Promise.all([
      getPlayerCharacter(entityId),
      getPlayerMow(entityId),
      getInventoryShard(entityId),
    ])
      .then(([playerCharacter, playerMow, inventoryShard]) => {
        if (!active) return

        const result = computePlanInsights({
          details: [detail],
          priorityByGoalId: new Map([[detail.goalId, 0]]),
          playerCharacterById: new Map([[detail.entityId, playerCharacter]]),
          playerMowById: new Map([[detail.entityId, playerMow]]),
          inventoryShardById: new Map([[detail.entityId, inventoryShard]]),
          inventoryUpgrades: inventoryUpgrades ?? [],
          upgradesById,
          battlesById,
          charactersById: charactersById!,
          mowsById: mowsById!,
          ascensionCostsById: ascensionCostsById!,
          unlockShardCostsById: unlockShardCostsById!,
          releaseTypeByGroupId,
          getCharacter,
          campaignName,
          campaignFullLabel,
          dailyEnergy: planningSettings.dailyEnergy,
          onslaughtProgress,
          currentOnslaughtTokens:
            liveProgress?.gameModeTokens.onslaught?.current ?? 0,
          onslaughtRewards: onslaughtRewards!,
        })

        setFetchState({
          status: "success",
          key,
          estimate: result.estimates.get(detail.goalId),
        })
      })
      .catch(() => {
        if (!active) return
        setFetchState({ status: "idle" })
      })

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    hasQuery,
    catalogReady,
    serverDataReady,
    key,
    isAuthenticated,
    planningSettings.dailyEnergy,
    liveProgress?.gameModeTokens.onslaught?.current,
  ])

  const isCurrent = fetchState.status === "success" && fetchState.key === key

  return {
    estimate: hasQuery && isCurrent ? fetchState.estimate : undefined,
    loading: hasQuery && (!serverDataReady || !isCurrent),
  }
}
