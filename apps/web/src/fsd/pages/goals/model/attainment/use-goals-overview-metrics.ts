import { useEffect, useState } from "react"
import { useQueries } from "@tanstack/react-query"
import { useIsAuthenticated } from "@azure/msal-react"
import { useLiveQuery } from "dexie-react-hooks"
import type { UnitId } from "@workspace/game-domain"
import type { PlayerDataChunkDto } from "@workspace/player-data"
import {
  getInventoryShard,
  getInventoryUpgrades,
  getPlayerCharacters,
  getPlayerInventoryItems,
  getPlayerMows,
} from "@workspace/player-data/queries"

import { goalQueries } from "@/entities/goal"

import {
  computeGoalBlockers,
  type GoalBlockers,
} from "../blockers/goal-blockers"
import type { EstimateOutcome } from "../estimate/estimate.domain"
import { calculateGoalResourceNeed } from "../estimate/goal-requirements"
import type { ResourceNeed } from "../estimate/progression-cost-calc"
import { useGoalCatalog } from "../shared/use-goal-catalog"
import { computeGoalAttainment } from "./goal-attainment"
import { computeGoalProgress, type GoalProgress } from "./goal-progress"

type InventoryShard = PlayerDataChunkDto<"inventory-shards">[number]

const UNKNOWN_PROGRESS: GoalProgress = { kind: "Unknown" }
const NO_BLOCKERS: GoalBlockers = { reasons: [], isBlocked: false }

export type GoalOverviewMetrics = {
  progress: GoalProgress
  /** Still-missing materials/shards/orbs (plan §2's "remaining resources") — `null` for an uncosted
   *  goal kind (Level, Item, Upgrade) or once nothing more is needed. No energy/day figure here: that
   *  depends on a shared farming plan's priority ordering, which only exists once a goal is scoped to
   *  a project (see `usePlanInsights`/the project-scoped Insights view) — not meaningful on this
   *  flat, cross-project list. */
  remaining: ResourceNeed | null
  blockers: GoalBlockers
}

const UNKNOWN_METRICS: GoalOverviewMetrics = {
  progress: UNKNOWN_PROGRESS,
  remaining: null,
  blockers: NO_BLOCKERS,
}

/**
 * Batch progress + remaining-resource info for every goal id in `goalIds` — the overview row/card's
 * progress bar and "still needs" summary (plan §2). Mirrors `use-goal-attainment.ts`'s batch-fetch
 * shape but kept separate: attainment answers "is the target already met" (drives tab grouping);
 * this answers "how far along, and what's left" (drives row display) — different questions, different
 * call sites, some shared inputs re-fetched from the same TanStack Query cache (no extra network cost).
 */
export function useGoalsOverviewMetrics(
  goalIds: readonly string[],
  /** A per-goal isolated/plan estimate, when the caller already has one (the project-scoped view's
   *  `usePlanInsights`, or a goal's own `useGoalEstimate`) — folded into `blockers` as an
   *  `EstimateBlocked` reason. Omitted on the flat cross-project overview, which has no such estimate
   *  (see `GoalOverviewMetrics.remaining`'s doc comment). */
  estimatesByGoalId?: ReadonlyMap<string, EstimateOutcome>
): ReadonlyMap<string, GoalOverviewMetrics> {
  const isAuthenticated = useIsAuthenticated()
  const {
    charactersById,
    mowsById,
    upgradesById,
    ascensionCostsById,
    unlockShardCostsById,
    getCharacter,
  } = useGoalCatalog()
  const detailQueries = useQueries({
    queries: goalIds.map((goalId) => ({
      ...goalQueries.detail(goalId),
      enabled: isAuthenticated,
    })),
  })
  const details = detailQueries.map((query) => query.data)

  // Prerequisite goals (plan §4's "a prerequisite goal has not been reached") can be outside
  // `goalIds` (a different tab, a different project) — fetched separately so their own attainment is
  // known regardless of where they currently sit.
  const dependencyGoalIds = [
    ...new Set(details.flatMap((detail) => detail?.dependsOn ?? [])),
  ]
  const dependencyQueries = useQueries({
    queries: dependencyGoalIds.map((goalId) => ({
      ...goalQueries.detail(goalId),
      enabled: isAuthenticated,
    })),
  })

  const playerCharacters = useLiveQuery(() => getPlayerCharacters(), [])
  const playerMows = useLiveQuery(() => getPlayerMows(), [])
  const inventoryUpgrades = useLiveQuery(() => getInventoryUpgrades(), [])
  const inventoryItems = useLiveQuery(() => getPlayerInventoryItems(), [])

  const playerCharacterById = new Map(
    (playerCharacters ?? []).map((character) => [character.unitId, character])
  )
  const playerMowById = new Map(
    (playerMows ?? []).map((mow) => [mow.unitId, mow])
  )

  // Unlock goals need the not-yet-unlocked unit's shard inventory — a separate chunk from
  // `characters`/`mows` (see player-data.schema.ts) — fetched only for the entities that need it.
  const unlockEntityIds = [
    ...new Set(
      details
        .filter((detail) => detail?.goalType === "Unlock")
        .map((detail) => detail!.entityId)
    ),
  ]
  const [inventoryShardByEntity, setInventoryShardByEntity] = useState<
    ReadonlyMap<string, InventoryShard | undefined>
  >(new Map())

  useEffect(() => {
    if (unlockEntityIds.length === 0) return undefined
    let active = true
    void Promise.all(
      unlockEntityIds.map((entityId) => getInventoryShard(entityId as UnitId))
    ).then((results) => {
      if (!active) return
      setInventoryShardByEntity(
        new Map(
          unlockEntityIds.map((entityId, index) => [entityId, results[index]])
        )
      )
    })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlockEntityIds.join(",")])

  const catalogReady = !!(
    charactersById &&
    mowsById &&
    ascensionCostsById &&
    unlockShardCostsById
  )

  const dependencyReachedById = new Map<string, boolean>()
  dependencyQueries.forEach((query, index) => {
    const dependencyGoalId = dependencyGoalIds[index]
    if (!dependencyGoalId) return
    const dependencyDetail = query.data
    if (!dependencyDetail) return
    const dependencyUnitId = dependencyDetail.entityId as UnitId
    dependencyReachedById.set(
      dependencyGoalId,
      computeGoalAttainment({
        detail: dependencyDetail,
        playerCharacter: playerCharacterById.get(dependencyUnitId),
        playerMow: playerMowById.get(dependencyUnitId),
        inventoryUpgrades: inventoryUpgrades ?? [],
        inventoryItems: inventoryItems ?? [],
      }).reached
    )
  })

  const result = new Map<string, GoalOverviewMetrics>()
  detailQueries.forEach((query, index) => {
    const goalId = goalIds[index]
    if (!goalId) return
    const detail = query.data
    if (!detail) {
      result.set(goalId, UNKNOWN_METRICS)
      return
    }
    const unitId = detail.entityId as UnitId
    const playerCharacter = playerCharacterById.get(unitId)
    const playerMow = playerMowById.get(unitId)
    const inventoryShard = inventoryShardByEntity.get(detail.entityId)

    const attainment = computeGoalAttainment({
      detail,
      playerCharacter,
      playerMow,
      inventoryUpgrades: inventoryUpgrades ?? [],
      inventoryItems: inventoryItems ?? [],
    })

    const progress = computeGoalProgress({
      detail,
      playerCharacter,
      playerMow,
      inventoryUpgrades: inventoryUpgrades ?? [],
      inventoryItems: inventoryItems ?? [],
      initialRarity: charactersById?.get(detail.entityId)?.initialRarity,
      unlockShardCostsById: unlockShardCostsById ?? new Map(),
      inventoryShard,
    })

    const remaining = catalogReady
      ? calculateGoalResourceNeed({
          detail,
          character: getCharacter(unitId),
          characterView: charactersById!.get(detail.entityId),
          mow: mowsById!.get(detail.entityId),
          playerCharacter,
          playerMow,
          inventoryShard,
          upgradesById,
          ascensionCostsById: ascensionCostsById!,
          unlockShardCostsById: unlockShardCostsById!,
        })
      : null

    const estimateOutcome = estimatesByGoalId?.get(goalId)
    const blockers = computeGoalBlockers({
      estimateReason:
        estimateOutcome?.status === "Blocked"
          ? estimateOutcome.reason
          : undefined,
      unreachedPrerequisiteGoalIds: detail.dependsOn.filter(
        (dependencyGoalId) =>
          dependencyReachedById.get(dependencyGoalId) === false
      ),
      playerDataUnavailable: catalogReady && attainment.status === "unknown",
      catalogDataUnavailable: !catalogReady,
    })

    result.set(goalId, { progress, remaining, blockers })
  })
  return result
}
