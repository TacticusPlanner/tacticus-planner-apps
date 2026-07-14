import { useEffect, useState } from "react"
import { useMsal } from "@azure/msal-react"
import { useLiveQuery } from "dexie-react-hooks"
import {
  rankAt,
  unitIdSchema,
  type UnitId,
  type UpgradeId,
} from "@workspace/game-domain"
import {
  getInventoryUpgrades,
  getPlayerCharacter,
} from "@workspace/player-data/queries"
import type { PlayerDataChunkDto } from "@workspace/player-data"

import {
  aggregateBaseUpgrades,
  aggregateOwnedBaseUpgrades,
  appliedUpgradeIds,
  rankUpUpgradeIds,
  type Character,
  type UpgradeWithFarmLocations,
} from "@/features/rank-lookup"
import { getGoal, type GoalDetail } from "@/entities/goal"
import type { ProjectGoalSummary } from "@/entities/project"

import { estimatePlan } from "./estimate/estimate"
import {
  DAILY_ENERGY,
  type EstimateResult,
  type GoalNeed,
  type MaterialNeed,
} from "./estimate/estimate.domain"
import { useGoalCatalog } from "./use-goal-catalog"

type PlayerCharacter = PlayerDataChunkDto<"characters">[number]

type FetchState =
  | { status: "idle" }
  | {
      status: "success"
      key: string
      results: Map<string, EstimateResult | null>
    }

const EMPTY_RESULTS: ReadonlyMap<string, EstimateResult | null> = new Map()

/**
 * Priority-shared plan estimate for a project's Rank-goal members (plan §9 context (b) / §5's
 * per-project priority). `ProjectGoalSummary` carries no `config`, so this batch-fetches each Rank
 * member's `GoalDetail` to read its target rank — the cost of a per-project estimate without an
 * always-on estimate column computed from summaries alone. No-ops (empty map) while no project is
 * selected or it has no Rank members; non-Rank members are simply absent from the result map (the
 * UI renders an em-dash for any goal with no entry — plan §16 phase 4 scope notes).
 */
export function usePlanEstimate(
  projectId: string | undefined,
  members: ProjectGoalSummary[]
) {
  const { instance, accounts } = useMsal()
  const account = instance.getActiveAccount() ?? accounts[0]
  const { getCharacter, upgradesById, battlesById } = useGoalCatalog()
  const inventoryUpgrades = useLiveQuery(() => getInventoryUpgrades(), [])

  const [fetchState, setFetchState] = useState<FetchState>({ status: "idle" })

  const rankMembers = members.filter(
    (member) => member.goal.goalType === "Rank"
  )
  // Cheap, stable dependency key for the effect below — re-fetch only when the project's Rank
  // membership or ordering actually changes, not on every parent render, and (tagged onto the
  // result below) to detect a still-in-flight query for a *previous* key.
  const memberKey = rankMembers
    .map((member) => `${member.goal.goalId}:${member.priority}`)
    .join(",")
  const hasQuery = Boolean(projectId && account && rankMembers.length > 0)

  useEffect(() => {
    if (!hasQuery || !account) {
      return undefined
    }

    let active = true

    void Promise.all(
      rankMembers.map((member) =>
        getGoal(instance, account, member.goal.goalId)
      )
    )
      .then(async (details) => {
        const characterIds = [
          ...new Set(details.map((detail) => detail.entityId)),
        ]
        const playerCharacterEntries = await Promise.all(
          characterIds.map((id) =>
            getPlayerCharacter(unitIdSchema.parse(id) as UnitId).then(
              (data) => [id, data] as const
            )
          )
        )
        return { details, playerCharacterById: new Map(playerCharacterEntries) }
      })
      .then(({ details, playerCharacterById }) => {
        if (!active) return

        const inventory: MaterialNeed[] = (inventoryUpgrades ?? []).map(
          (entry) => ({ id: entry.upgradeId, count: entry.amount })
        )

        const priorityByGoalId = new Map(
          rankMembers.map((member) => [member.goal.goalId, member.priority])
        )
        const goals = details
          .map((detail) =>
            toGoalNeed(
              detail,
              priorityByGoalId,
              playerCharacterById,
              getCharacter,
              upgradesById
            )
          )
          .filter((need): need is GoalNeed => need !== null)

        const results = estimatePlan({
          goals,
          upgradesById,
          battlesById,
          dailyEnergy: DAILY_ENERGY,
          inventory,
        })
        setFetchState({ status: "success", key: memberKey, results })
      })
      .catch(() => {
        if (!active) return
        setFetchState({ status: "idle" })
      })

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasQuery, account?.homeAccountId, memberKey])

  // The fetched results are only "current" once their tagged key matches today's query — while a
  // new query is in flight (or none has resolved yet), this reads as loading rather than showing a
  // stale prior project's numbers.
  const isCurrent =
    fetchState.status === "success" && fetchState.key === memberKey

  return {
    results: hasQuery && isCurrent ? fetchState.results : EMPTY_RESULTS,
    loading: hasQuery && !isCurrent,
  }
}

/**
 * A Rank goal's raw material demand net of what's already permanently applied to the character
 * (not shareable across goals — see `usePlanEstimate`'s doc comment). Loose inventory is
 * deliberately *not* netted out here: `estimatePlan` allocates the shared inventory across goals by
 * priority itself, so passing it a pre-netted need would double-count that allocation. Returns `null`
 * when the goal can't be computed (no rank target, no catalog entry, or an empty range).
 */
function toGoalNeed(
  detail: GoalDetail,
  priorityByGoalId: ReadonlyMap<string, number>,
  playerCharacterById: ReadonlyMap<string, PlayerCharacter | undefined>,
  getCharacter: (unitId: UnitId) => Character | undefined,
  upgradesById: ReadonlyMap<UpgradeId, UpgradeWithFarmLocations>
): GoalNeed | null {
  const priority = priorityByGoalId.get(detail.goalId)
  const rankTarget = detail.config.rank
  const character = getCharacter(unitIdSchema.parse(detail.entityId) as UnitId)
  if (priority === undefined || !rankTarget || !character) return null

  const rankStart = rankAt(rankTarget.start)
  const rankEnd = rankAt(rankTarget.end)
  const requiredIds = rankUpUpgradeIds(
    character,
    rankStart,
    rankEnd,
    rankTarget.endPointFive
  )
  if (requiredIds.length === 0) return null
  const required = aggregateBaseUpgrades(requiredIds, upgradesById)

  const playerCharacter = playerCharacterById.get(detail.entityId)
  const appliedIds = playerCharacter
    ? appliedUpgradeIds(
        character,
        playerCharacter.rank,
        playerCharacter.appliedUpgradeSlots
      )
    : []
  // Empty inventory list here on purpose — only nets out already-applied materials, not shared stock.
  const appliedById = new Map(
    aggregateOwnedBaseUpgrades(appliedIds, [], upgradesById).map((entry) => [
      entry.id,
      entry.count,
    ])
  )

  const needs: MaterialNeed[] = required
    .map((need) => ({
      id: need.id,
      count: Math.max(0, need.count - (appliedById.get(need.id) ?? 0)),
    }))
    .filter((need) => need.count > 0)

  return {
    goalId: detail.goalId,
    priority,
    needs,
    farmingLocationIds: detail.config.farmingLocationIds,
  }
}
