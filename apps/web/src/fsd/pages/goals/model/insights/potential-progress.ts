import type {
  CharacterStorageModel,
  UnlockShardCostStorageModel,
} from "@workspace/game-catalog"
import type { UpgradeId } from "@workspace/game-domain"
import type { PlayerDataChunkDto } from "@workspace/player-data"

import type { GoalDetail } from "@/entities/goal"

import {
  computeGoalProgress,
  type GoalProgress,
} from "../attainment/goal-progress"
import type { GoalInventoryAllocation } from "@/features/goal-farming"

function clampRatio(value: number): number {
  return Math.min(1, Math.max(0, value))
}

function actualRatio(progress: GoalProgress): number | null {
  return progress.kind === "Unknown" || progress.ratio === null
    ? null
    : progress.ratio
}

function stageBoundary(detail: GoalDetail, target: string): number {
  if (target === "final") return 1

  if (detail.goalType === "Rank" && detail.config.rank) {
    const { start, end } = detail.config.rank
    const targetIndex = Number(target)
    if (!Number.isFinite(targetIndex)) return 1
    const requiredApplied = Math.max(
      detail.config.rank.endAppliedUpgrades,
      detail.config.rank.endPointFive ? 3 : 0
    )
    const totalSlots = (end - start) * 6 + requiredApplied
    if (totalSlots <= 0 || targetIndex >= end) return 1
    return clampRatio(((targetIndex - start) * 6) / totalSlots)
  }

  if (detail.goalType === "Ability" && detail.config.ability) {
    const ability = detail.config.ability
    const usesActive = ability.activeEnd > ability.activeStart
    const start = usesActive ? ability.activeStart : ability.passiveStart
    const end = usesActive ? ability.activeEnd : ability.passiveEnd
    const targetLevel = Number(target)
    if (!Number.isFinite(targetLevel) || end <= start) return 1
    return clampRatio((targetLevel - start) / (end - start))
  }

  return 1
}

export function computePotentialProgressRatio(
  detail: GoalDetail,
  progress: GoalProgress,
  allocation: GoalInventoryAllocation<string> | undefined
): number | null {
  const current = actualRatio(progress)
  if (current === null || !allocation) return null

  let potential = current
  let previousBoundary = current

  for (const stage of allocation.stages) {
    const boundary = Math.max(
      previousBoundary,
      stageBoundary(detail, stage.target)
    )
    const required = stage.needs.reduce((sum, need) => sum + need.count, 0)
    const remaining = stage.remaining.reduce((sum, need) => sum + need.count, 0)
    const allocatedFraction =
      required <= 0 ? 1 : clampRatio((required - remaining) / required)

    potential = Math.max(
      potential,
      previousBoundary + (boundary - previousBoundary) * allocatedFraction
    )
    if (remaining > 0) break
    previousBoundary = boundary
  }

  return clampRatio(Math.max(current, potential))
}

/** Each Ascension/Rank/Ability goal's Potential-progress ratio from its plan allocation (orb allocation
 *  for Ascension, upgrade allocation for Rank/Ability), keyed by goal id. */
export function buildPotentialProgressByGoalId(params: {
  orderedDetails: readonly GoalDetail[]
  orbAllocations: ReadonlyMap<string, GoalInventoryAllocation<string>>
  allocations: ReadonlyMap<string, GoalInventoryAllocation<string>>
  playerCharacterById: ReadonlyMap<
    string,
    PlayerDataChunkDto<"characters">[number] | undefined
  >
  playerMowById: ReadonlyMap<
    string,
    PlayerDataChunkDto<"mows">[number] | undefined
  >
  inventoryUpgrades: readonly { upgradeId: string; amount: number }[]
  charactersById: ReadonlyMap<string, CharacterStorageModel>
  unlockShardCostsById: ReadonlyMap<string, UnlockShardCostStorageModel>
  inventoryShardById: ReadonlyMap<
    string,
    PlayerDataChunkDto<"inventory-shards">[number] | undefined
  >
}): Map<string, number> {
  const byGoalId = new Map<string, number>()
  for (const detail of params.orderedDetails) {
    const allocation =
      detail.goalType === "Ascension"
        ? params.orbAllocations.get(detail.goalId)
        : detail.goalType === "Rank" || detail.goalType === "Ability"
          ? params.allocations.get(detail.goalId)
          : undefined
    if (!allocation) continue
    const progress = computeGoalProgress({
      detail,
      playerCharacter: params.playerCharacterById.get(detail.entityId),
      playerMow: params.playerMowById.get(detail.entityId),
      inventoryUpgrades: params.inventoryUpgrades.map((entry) => ({
        ...entry,
        upgradeId: entry.upgradeId as UpgradeId,
      })),
      inventoryItems: undefined,
      initialRarity: params.charactersById.get(detail.entityId)?.initialRarity,
      unlockShardCostsById: params.unlockShardCostsById,
      inventoryShard: params.inventoryShardById.get(detail.entityId),
    })
    const ratio = computePotentialProgressRatio(detail, progress, allocation)
    if (ratio !== null) byGoalId.set(detail.goalId, ratio)
  }
  return byGoalId
}
