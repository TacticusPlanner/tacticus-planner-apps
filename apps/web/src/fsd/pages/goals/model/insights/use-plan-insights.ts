import { useEffect, useState } from "react"
import { useQueries, useQuery } from "@tanstack/react-query"
import { useIsAuthenticated } from "@azure/msal-react"
import { useLiveQuery } from "dexie-react-hooks"
import { unitIdSchema, type UnitId } from "@workspace/game-domain"
import { getOnslaughtRewards } from "@workspace/game-catalog/queries"
import {
  getInventoryShard,
  getInventoryOrbs,
  getInventoryUpgrades,
  getLiveProgress,
  getPlayerCharacter,
  getPlayerMow,
} from "@workspace/player-data/queries"

import { goalQueries } from "@/entities/goal"
import { onslaughtProgressQueries } from "@/entities/player-data-override"
import type { ProjectGoalSummary } from "@/entities/project"
import { usePlanningSettings } from "@/entities/planning-setting"
import { useCampaignDisplay } from "@/shared/lib"

import { computePlanInsights } from ".//plan-insights-calc"
import {
  EMPTY_PLAN_INSIGHTS_RESULT,
  type PlanInsightsResult,
} from ".//use-plan-insights.domain"
import { useGoalCatalog } from "../shared/use-goal-catalog"

// Only these statuses represent resources the plan still needs to acquire — an archived goal's
// demand is done. A goal that's already reached its target (see `model/attainment/`) drops out of
// the cost totals on its own merit: `calculateGoalResourceNeed`/`calculateGoalFarmingStages`
// naturally return no need once the target's synced state is met, for every costed goal kind.
const ACTIVE_STATUSES = new Set(["Active", "Paused"])

type FetchState =
  | { status: "idle" }
  | { status: "success"; key: string; result: PlanInsightsResult }

/**
 * The Insights view's aggregation across a project's still-active goals (plan §16 phase 7): total
 * missing resources by rarity/type, a combined energy/completion estimate, farming bottlenecks, and
 * campaign/event relevance annotated with which goals (entities) benefit. Builds on the same
 * batch-fetch shape as `usePlanEstimate`, but covers every costable goal type (Rank, MoW Ability,
 * Ascension, Unlock, Shards) rather than Rank alone — Character Ability has no cost data anywhere and
 * contributes nothing. No-ops (the empty result) while no project is selected or it has no costable
 * members. The actual aggregation is pure and lives in `plan-insights-calc.ts` (this repo's max-lines
 * rule) — this hook is only the batch-fetch + caching shell around it, mirroring `usePlanEstimate`.
 */
export function usePlanInsights(
  projectId: string | undefined,
  members: ProjectGoalSummary[]
) {
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
  const inventoryOrbs = useLiveQuery(() => getInventoryOrbs(), [])
  const liveProgress = useLiveQuery(() => getLiveProgress(), [])
  const onslaughtRewards = useLiveQuery(() => getOnslaughtRewards(), [])
  const { settings: planningSettings } = usePlanningSettings()

  const [fetchState, setFetchState] = useState<FetchState>({ status: "idle" })

  const activeMembers = members.filter((member) =>
    ACTIVE_STATUSES.has(member.goal.status)
  )
  const memberKey = activeMembers
    .map((member) => `${member.goal.goalId}:${member.priority}`)
    .join(",")
  const calculationKey = `${memberKey}:${JSON.stringify({
    inventoryUpgrades,
    inventoryOrbs,
  })}`
  const hasQuery = Boolean(
    projectId && isAuthenticated && activeMembers.length > 0
  )
  const goalDetailQueries = useQueries({
    queries: hasQuery
      ? activeMembers.map((member) => goalQueries.detail(member.goal.goalId))
      : [],
  })
  const onslaughtProgressQuery = useQuery({
    ...onslaughtProgressQueries.current(),
    enabled: hasQuery,
  })
  const serverDataVersion = [
    ...goalDetailQueries.map((query) => query.dataUpdatedAt),
    onslaughtProgressQuery.dataUpdatedAt,
  ].join(",")
  const serverDataReady =
    goalDetailQueries.length === activeMembers.length &&
    goalDetailQueries.every((query) => query.isSuccess) &&
    onslaughtProgressQuery.isSuccess
  const catalogReady =
    !!charactersById &&
    !!mowsById &&
    !!onslaughtRewards &&
    !!ascensionCostsById &&
    !!unlockShardCostsById

  useEffect(() => {
    if (!hasQuery || !catalogReady || !serverDataReady) {
      return undefined
    }

    let active = true
    const details = goalDetailQueries.flatMap((query) =>
      query.data ? [query.data] : []
    )
    const onslaughtProgress = onslaughtProgressQuery.data

    void Promise.resolve()
      .then(async () => {
        const entityIds = [...new Set(details.map((detail) => detail.entityId))]
        const [
          playerCharacterEntries,
          playerMowEntries,
          inventoryShardEntries,
        ] = await Promise.all([
          Promise.all(
            entityIds.map((id) =>
              getPlayerCharacter(unitIdSchema.parse(id) as UnitId).then(
                (data) => [id, data] as const
              )
            )
          ),
          Promise.all(
            entityIds.map((id) =>
              getPlayerMow(unitIdSchema.parse(id) as UnitId).then(
                (data) => [id, data] as const
              )
            )
          ),
          Promise.all(
            entityIds.map((id) =>
              getInventoryShard(unitIdSchema.parse(id) as UnitId).then(
                (data) => [id, data] as const
              )
            )
          ),
        ])

        return {
          details,
          onslaughtProgress,
          playerCharacterById: new Map(playerCharacterEntries),
          playerMowById: new Map(playerMowEntries),
          inventoryShardById: new Map(inventoryShardEntries),
        }
      })
      .then(
        ({
          details,
          playerCharacterById,
          playerMowById,
          inventoryShardById,
          onslaughtProgress,
        }) => {
          if (!active) return

          const priorityByGoalId = new Map(
            activeMembers.map((member) => [member.goal.goalId, member.priority])
          )

          const result = computePlanInsights({
            details,
            priorityByGoalId,
            playerCharacterById,
            playerMowById,
            inventoryShardById,
            inventoryUpgrades: inventoryUpgrades ?? [],
            inventoryOrbs,
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

          setFetchState({ status: "success", key: calculationKey, result })
        }
      )
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
    serverDataVersion,
    isAuthenticated,
    calculationKey,
    planningSettings.dailyEnergy,
    liveProgress?.gameModeTokens.onslaught?.current,
  ])

  const isCurrent =
    fetchState.status === "success" && fetchState.key === calculationKey

  return {
    result:
      hasQuery && isCurrent ? fetchState.result : EMPTY_PLAN_INSIGHTS_RESULT,
    loading: hasQuery && (!serverDataReady || !isCurrent),
  }
}
