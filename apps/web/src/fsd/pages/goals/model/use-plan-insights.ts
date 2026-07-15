import { useEffect, useState } from "react"
import { useMsal } from "@azure/msal-react"
import { useLiveQuery } from "dexie-react-hooks"
import { unitIdSchema, type UnitId } from "@workspace/game-domain"
import {
  getInventoryShard,
  getInventoryUpgrades,
  getPlayerCharacter,
  getPlayerMow,
} from "@workspace/player-data/queries"

import { getGoal } from "@/entities/goal"
import type { ProjectGoalSummary } from "@/entities/project"
import { usePlanningSettings } from "@/entities/planning-setting"
import { useCampaignDisplay } from "@/shared/lib"

import { computePlanInsights } from "./plan-insights-calc"
import {
  EMPTY_PLAN_INSIGHTS_RESULT,
  type PlanInsightsResult,
} from "./use-plan-insights.domain"
import { useGoalCatalog } from "./use-goal-catalog"

// Only these statuses represent resources the plan still needs to acquire — a completed/archived
// goal's demand is done, mirroring goals-page.tsx's ACTIVE_TAB_STATUSES.
const ACTIVE_STATUSES = new Set(["Draft", "Active", "Paused"])

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
  const { instance, accounts } = useMsal()
  const account = instance.getActiveAccount() ?? accounts[0]
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
  const { settings: planningSettings } = usePlanningSettings()

  const [fetchState, setFetchState] = useState<FetchState>({ status: "idle" })

  const activeMembers = members.filter((member) =>
    ACTIVE_STATUSES.has(member.goal.status)
  )
  const memberKey = activeMembers
    .map((member) => `${member.goal.goalId}:${member.priority}`)
    .join(",")
  const hasQuery = Boolean(projectId && account && activeMembers.length > 0)
  const catalogReady =
    !!charactersById &&
    !!mowsById &&
    !!ascensionCostsById &&
    !!unlockShardCostsById

  useEffect(() => {
    if (!hasQuery || !account || !catalogReady) {
      return undefined
    }

    let active = true

    void Promise.all(
      activeMembers.map((member) =>
        getGoal(instance, account, member.goal.goalId)
      )
    )
      .then(async (details) => {
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
            ordering: planningSettings.ordering,
          })

          setFetchState({ status: "success", key: memberKey, result })
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
    account?.homeAccountId,
    memberKey,
    planningSettings.dailyEnergy,
    planningSettings.ordering,
  ])

  const isCurrent =
    fetchState.status === "success" && fetchState.key === memberKey

  return {
    result:
      hasQuery && isCurrent ? fetchState.result : EMPTY_PLAN_INSIGHTS_RESULT,
    loading: hasQuery && !isCurrent,
  }
}
