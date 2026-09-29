import { useEffect, useState } from "react"
import { useQueries, useQuery } from "@tanstack/react-query"
import { useIsAuthenticated } from "@azure/msal-react"
import { useLiveQuery } from "dexie-react-hooks"
import { unitIdSchema, type UnitId } from "@workspace/game-domain"
import { getOnslaughtRewards, getShops } from "@workspace/game-catalog/queries"
import {
  getInventoryAbilityMaterials,
  getInventoryShard,
  getInventoryOrbs,
  getInventoryUpgrades,
  getInventoryXpBooks,
  getLiveProgress,
  getPlayerCharacter,
  getPlayerMow,
} from "@workspace/player-data/queries"

import { goalQueries, useGlobalGoalPlan } from "@/entities/goal"
import { onslaughtProgressQueries } from "@/entities/player-data-override"
import { usePlanningSettings } from "@/entities/planning-setting"
import { useCampaignDisplay } from "@/shared/lib"

import { computePlanInsights } from ".//plan-insights-calc"
import {
  EMPTY_PLAN_INSIGHTS_RESULT,
  type PlanInsightsResult,
} from ".//use-plan-insights.domain"
import { useGoalCatalog } from "../shared/use-goal-catalog"

type FetchState =
  | { status: "idle" }
  | {
      status: "success"
      key: string
      /** The goal-id set (plus project) this result was computed for, captured separately from
       *  `key` (which also folds in priority/inventory) — see `idSetKey` below: a priority-only
       *  change (e.g. a drag reorder, which touches every in-flight member's priority at once)
       *  shouldn't blank the display while it recomputes, only a change to which goals are even
       *  being planned for should. */
      idSetKey: string
      result: PlanInsightsResult
    }

/**
 * The Insights view's aggregation across the account's Active goals in global order (plan §16 phase 7),
 * optionally scoped to a project: `scopeGoalIds` narrows what the totals, dates and bottlenecks *report*
 * to that project's goals, but the allocation and estimate always run over the one global sequence — a
 * project view shows what the global run produces for its goals, never an alternate project-only plan.
 * Paused goals keep their position but do not enter the run. Total
 * missing resources by rarity/type, a combined energy/completion estimate, farming bottlenecks, and
 * campaign/event relevance annotated with which goals (entities) benefit. Builds on the same
 * batch-fetch shape as `usePlanEstimate`, but covers every costable goal type (Rank, MoW Ability,
 * Ascension, Unlock, Shards) rather than Rank alone — Character Ability has no cost data anywhere and
 * contributes nothing. No-ops (the empty result) while no project is selected or it has no costable
 * members. The actual aggregation is pure and lives in `plan-insights-calc.ts` (this repo's max-lines
 * rule) — this hook is only the batch-fetch + caching shell around it, mirroring `usePlanEstimate`.
 */
export function usePlanInsights(scopeGoalIds?: readonly string[] | null) {
  const isAuthenticated = useIsAuthenticated()
  const globalPlan = useGlobalGoalPlan()
  const {
    upgradesById,
    battlesById,
    charactersById,
    mowsById,
    ascensionCostsById,
    unlockShardCostsById,
    mowUpgradeCostsByLevel,
    characterAbilityCostsByLevel,
    releaseTypeByGroupId,
    getCharacter,
  } = useGoalCatalog()
  const { name: campaignName, fullLabel: campaignFullLabel } =
    useCampaignDisplay()
  const inventoryUpgrades = useLiveQuery(() => getInventoryUpgrades(), [])
  const inventoryOrbs = useLiveQuery(() => getInventoryOrbs(), [])
  const inventoryXpBooks = useLiveQuery(() => getInventoryXpBooks(), [])
  const abilityInventory = useLiveQuery(
    () => getInventoryAbilityMaterials(),
    []
  )
  const liveProgress = useLiveQuery(() => getLiveProgress(), [])
  const onslaughtRewards = useLiveQuery(() => getOnslaughtRewards(), [])
  const shops = useLiveQuery(() => getShops(), [])
  const { settings: planningSettings } = usePlanningSettings()

  const [fetchState, setFetchState] = useState<FetchState>({ status: "idle" })

  const activeMembers = globalPlan.entries
  const scopeIds = scopeGoalIds ? new Set(scopeGoalIds) : undefined
  const scopeKey = scopeGoalIds ? [...scopeGoalIds].sort().join(",") : "all"
  const memberKey = activeMembers
    .map((member) => `${member.goal.goalId}:${member.goal.globalPriority}`)
    .join(",")
  // Goal-id set only, no priority — a reorder changes every in-flight member's priority at once,
  // which would otherwise blank the whole display on every drag while `calculationKey` recomputes.
  const idSetKey = `${scopeKey}:${activeMembers
    .map((member) => member.goal.goalId)
    .sort()
    .join(",")}`
  const calculationKey = `${scopeKey}:${memberKey}:${JSON.stringify({
    inventoryUpgrades,
    inventoryOrbs,
    inventoryXpBooks,
    abilityInventory,
    xpBookRarity: planningSettings.xpBookRarity,
  })}`
  // A project scope that holds none of the plan's Active goals has nothing to report.
  const hasQuery = Boolean(
    isAuthenticated &&
    activeMembers.length > 0 &&
    (!scopeIds ||
      activeMembers.some((member) => scopeIds.has(member.goal.goalId)))
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
  // A failed detail/progress fetch would otherwise leave `loading` true forever.
  const isError =
    hasQuery &&
    (goalDetailQueries.some((query) => query.isError) ||
      onslaughtProgressQuery.isError)
  const retry = () => {
    goalDetailQueries.forEach((query) => {
      if (query.isError) void query.refetch()
    })
    if (onslaughtProgressQuery.isError) void onslaughtProgressQuery.refetch()
  }
  const catalogReady =
    !!charactersById &&
    !!mowsById &&
    !!onslaughtRewards &&
    !!shops &&
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
            activeMembers.map((member) => [
              member.goal.goalId,
              member.goal.globalPriority ?? Number.MAX_SAFE_INTEGER,
            ])
          )

          const result = computePlanInsights({
            details,
            priorityByGoalId,
            scopeGoalIds: scopeIds,
            playerCharacterById,
            playerMowById,
            inventoryShardById,
            inventoryUpgrades: inventoryUpgrades ?? [],
            inventoryOrbs,
            inventoryXpBooks,
            abilityInventory,
            xpBookRarity: planningSettings.xpBookRarity,
            upgradesById,
            battlesById,
            charactersById: charactersById!,
            mowsById: mowsById!,
            ascensionCostsById: ascensionCostsById!,
            unlockShardCostsById: unlockShardCostsById!,
            abilityLadders: {
              mowUpgradeCostsByLevel,
              characterAbilityCostsByLevel,
            },
            releaseTypeByGroupId,
            getCharacter,
            campaignName,
            campaignFullLabel,
            dailyEnergy: planningSettings.dailyEnergy,
            onslaughtProgress,
            currentOnslaughtTokens:
              liveProgress?.gameModeTokens.onslaught?.current ?? 0,
            onslaughtRewards: onslaughtRewards!,
            shops,
          })

          setFetchState({
            status: "success",
            key: calculationKey,
            idSetKey,
            result,
          })
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
    mowUpgradeCostsByLevel,
    characterAbilityCostsByLevel,
    isAuthenticated,
    calculationKey,
    planningSettings.dailyEnergy,
    liveProgress?.gameModeTokens.onslaught?.current,
  ])

  const isCurrent =
    fetchState.status === "success" && fetchState.key === calculationKey
  // Same goal-id set as the last successful result, just recomputing (priority/inventory changed)
  // — keep showing it instead of blanking to empty, so a reorder doesn't flash the Progress/Done-by
  // display to nothing while `calculationKey` catches up.
  const showsSameGoalSet =
    fetchState.status === "success" && fetchState.idSetKey === idSetKey

  return {
    result:
      hasQuery && (isCurrent || showsSameGoalSet)
        ? fetchState.result
        : EMPTY_PLAN_INSIGHTS_RESULT,
    loading:
      globalPlan.loading ||
      (hasQuery && !isError && (!serverDataReady || !isCurrent)),
    isError,
    retry,
  }
}
