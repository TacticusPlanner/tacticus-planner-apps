import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useIsAuthenticated } from "@azure/msal-react"
import { unitIdSchema } from "@workspace/game-domain"
import {
  getInventoryShard,
  getPlayerCharacter,
  getPlayerMow,
} from "@workspace/player-data/queries"

import { useGlobalGoalPlan, type GoalDetail } from "@/entities/goal"
import { onslaughtProgressQueries } from "@/entities/player-data-override"
import { useCatalogDataset } from "@/shared/local-data"

import { estimateNewGoalsForProject } from "./per-project-estimate"
import {
  toOnslaughtRunsPerDay,
  type EstimateOutcome,
} from "@/features/goal-farming/@x/goal-planning"
import { useGoalCatalog } from "../shared/use-goal-catalog"
import { readyData } from "../shared/read-data"

export type PerProjectEstimate =
  | { status: "loading" }
  | { status: "unavailable" }
  | { status: "outcome"; outcome: EstimateOutcome }

/**
 * The estimated duration for the goal(s) about to be created, reported per selected project
 * ("What will be created"). Priority is one account-wide order, so a new goal always appends after
 * every existing Active goal and its estimate is the same whichever projects it is filed into: the
 * hook folds `newDetails` in behind the account's Active goals (global order) and reuses the exact
 * engine the Insights view runs (`estimateNewGoalsForProject`/`computePlanInsights`), then returns that
 * one outcome under each selected project id. Reads the goals in full from the goals list (shared
 * with Insights) and per-entity player/inventory data — the same shape `use-plan-insights.ts` uses.
 */
export function usePerProjectEstimates({
  selectedProjectIds,
  newDetails,
  dailyEnergy,
  inventoryUpgrades,
  enabled,
}: {
  selectedProjectIds: string[]
  newDetails: GoalDetail[]
  dailyEnergy: number
  inventoryUpgrades: readonly { upgradeId: string; amount: number }[]
  enabled: boolean
}): ReadonlyMap<string, PerProjectEstimate> {
  const isAuthenticated = useIsAuthenticated()
  const {
    charactersById,
    mowsById,
    upgradesById,
    battlesById,
    ascensionCostsById,
    unlockShardCostsById,
    releaseTypeByGroupId,
    getCharacter,
  } = useGoalCatalog()
  // A new goal's selected Onslaught/Shop acquisition sources (tacticus-planner-apps#103) need these
  // to contribute to this preview the same way they do for Today/Insights/Raids Plan — mirrors
  // `useProgressionPreview`'s own fetch of the same three, deduped against it by the query cache.
  const shops = readyData(useCatalogDataset("shops"))
  const onslaughtRewards = readyData(useCatalogDataset("onslaught-rewards"))
  const onslaughtRunsPerDay = readyData(
    useCatalogDataset("global-values", toOnslaughtRunsPerDay)
  )
  const { data: onslaughtProgress } = useQuery({
    ...onslaughtProgressQueries.current(),
    enabled: isAuthenticated,
  })

  const hasQuery = enabled && isAuthenticated && selectedProjectIds.length > 0

  const globalPlan = useGlobalGoalPlan()
  const members = globalPlan.active.map((goal) => ({
    goalId: goal.goalId,
    priority: goal.globalPriority ?? Number.MAX_SAFE_INTEGER,
  }))
  const projectGoalsReady =
    !hasQuery || (!globalPlan.loading && !globalPlan.isError)

  const detailsReady = projectGoalsReady && !globalPlan.loading

  const catalogReady =
    !!charactersById &&
    !!mowsById &&
    !!onslaughtRewards?.length &&
    onslaughtRunsPerDay !== undefined &&
    !!ascensionCostsById &&
    !!unlockShardCostsById

  const memberKey = members.map((m) => `${m.goalId}:${m.priority}`).join(",")
  // Includes each preview goal's full `config` (not just its id/type) — a preview goal's id/type
  // stay fixed across renders for the same entity + enabled goal kinds (see buildPreviewGoalDetails),
  // so without the config's content here, changing e.g. the selected shard-farming locations or a
  // rank/progression target wouldn't invalidate the cached estimate below.
  const newDetailsKey = newDetails
    .map(
      (detail) =>
        `${detail.goalId}:${detail.goalType}:${JSON.stringify(detail.config)}`
    )
    .join(",")
  const currentKey = `${memberKey}|${newDetailsKey}|${selectedProjectIds.join(",")}`

  const [state, setState] = useState<{
    key: string
    results: ReadonlyMap<string, PerProjectEstimate>
  }>({ key: "", results: new Map() })

  useEffect(() => {
    if (
      !hasQuery ||
      !projectGoalsReady ||
      !detailsReady ||
      !catalogReady ||
      newDetails.length === 0
    ) {
      // Nothing to estimate (no costed goal about to be created, or prerequisites not ready yet) —
      // the render-time fallback below already reads this as "nothing to show" without needing a
      // state update from here.
      return undefined
    }

    let active = true
    const existingDetails = globalPlan.active
    const entityIds = [
      ...new Set(
        [...existingDetails, ...newDetails].map((detail) => detail.entityId)
      ),
    ]

    // Promise.resolve(...) wraps each call rather than chaining .then() directly onto it — Dexie's
    // real queries always return a promise, but this stays defensive against a test double that
    // hands back a bare value synchronously.
    void Promise.all([
      Promise.all(
        entityIds.map((id) =>
          Promise.resolve(getPlayerCharacter(unitIdSchema.parse(id))).then(
            (data) => [id, data] as const
          )
        )
      ),
      Promise.all(
        entityIds.map((id) =>
          Promise.resolve(getPlayerMow(unitIdSchema.parse(id))).then(
            (data) => [id, data] as const
          )
        )
      ),
      Promise.all(
        entityIds.map((id) =>
          Promise.resolve(getInventoryShard(unitIdSchema.parse(id))).then(
            (data) => [id, data] as const
          )
        )
      ),
    ])
      .then(([characterEntries, mowEntries, shardEntries]) => {
        if (!active) return

        const playerCharacterById = new Map(characterEntries)
        const playerMowById = new Map(mowEntries)
        const inventoryShardById = new Map(shardEntries)

        const existingPriorities = new Map(
          members.map((member) => [member.goalId, member.priority])
        )
        const maxExistingPriority = members.reduce(
          (max, member) =>
            member.priority === Number.MAX_SAFE_INTEGER
              ? max
              : Math.max(max, member.priority),
          0
        )
        const outcome = estimateNewGoalsForProject({
          existingDetails,
          existingPriorities,
          newDetails,
          newBasePriority: maxExistingPriority + 1,
          playerCharacterById,
          playerMowById,
          inventoryShardById,
          inventoryUpgrades,
          upgradesById,
          battlesById,
          charactersById: charactersById,
          mowsById: mowsById,
          ascensionCostsById: ascensionCostsById,
          unlockShardCostsById: unlockShardCostsById,
          releaseTypeByGroupId,
          getCharacter,
          dailyEnergy,
          onslaughtProgress,
          onslaughtRewards,
          onslaughtRunsPerDay,
          shops,
        })

        // One global order, so one outcome: every selected project shows the same estimate.
        const results = new Map<string, PerProjectEstimate>(
          selectedProjectIds.map((projectId) => [
            projectId,
            outcome
              ? { status: "outcome", outcome }
              : { status: "unavailable" },
          ])
        )

        setState({ key: currentKey, results })
      })
      .catch(() => {
        if (!active) return
        setState({ key: currentKey, results: new Map() })
      })

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    hasQuery,
    projectGoalsReady,
    detailsReady,
    catalogReady,
    memberKey,
    newDetailsKey,
    dailyEnergy,
  ])

  if (!hasQuery || newDetails.length === 0) return new Map()

  if (state.key !== currentKey) {
    return new Map(
      selectedProjectIds.map((projectId) => [projectId, { status: "loading" }])
    )
  }
  return state.results
}
