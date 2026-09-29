import {
  allocateLevelXp,
  requiredLevelForGoal,
  type LevelXpNeed,
} from "@/features/goal-farming"
import type { GoalDetail } from "@/entities/goal"

import { levelPotentialRatio } from "../attainment/level-requirement-progress"

export type LevelPotentialProgress = {
  /** Potential progress ratio of each Rank/Ability goal's level requirement, keyed by goal id — how far
   *  the account's owned XP books could take the character toward the required level *right now*. */
  ratioByGoalId: Map<string, number>
  /** Each goal's own charged XP interval (`LevelXpAllocation.chargedXp`) — the raw input a caller
   *  converts to a *needed* book-equivalent count in the user's selected XP-book rarity
   *  (show-xp-book-availability-per-goal, `ceil(chargedXp / bookXp)`). Only a goal whose character is
   *  below its required level gets an entry. */
  chargedXpByGoalId: Map<string, number>
  /** The shared owned-book pool's raw XP total at each goal's own turn in priority order
   *  (`LevelXpAllocation.poolXpAvailable`) — the raw input a caller converts to an *available*
   *  book-equivalent count in the user's selected XP-book rarity (show-xp-book-availability-per-goal,
   *  `floor(poolXpAvailable / bookXp)`). Only a goal whose character is below its required level gets
   *  an entry. */
  poolXpAvailableByGoalId: Map<string, number>
  /** Gold to apply each goal's needed books (`LevelXpAllocation.gold`) � V1's Rank "Gold". */
  goldByGoalId: Map<string, number>
}

/** Potential progress of each Rank/Ability goal's level requirement, keyed by that goal's id — how far
 *  the account's owned XP books could take the character toward the required level *right now*, spent in
 *  priority order through the one shared `allocateLevelXp` so overlapping Rank milestones (and an Ability
 *  goal) of one unit count the same levels and books once. Only a goal whose character is below its
 *  required level gets an entry. Potential is never attainment: the goal's Actual level is unchanged. */
export function buildLevelPotentialProgress(params: {
  orderedDetails: readonly GoalDetail[]
  priorityByGoalId: ReadonlyMap<string, number>
  playerCharacterById: ReadonlyMap<
    string,
    { xpLevel: number; xp: number } | undefined
  >
  inventoryXpBooks: readonly { xpBookId: string; amount: number }[] | undefined
  xpBookRarity?: string | null
}): LevelPotentialProgress {
  const needs: LevelXpNeed[] = []
  for (const detail of params.orderedDetails) {
    const requiredLevel = requiredLevelForGoal(detail)
    const priority = params.priorityByGoalId.get(detail.goalId)
    const unit = params.playerCharacterById.get(detail.entityId)
    if (requiredLevel === null || priority === undefined || !unit) continue
    needs.push({
      goalId: detail.goalId,
      unitKey: `${detail.entityType}:${detail.entityId}`,
      priority,
      currentLevel: unit.xpLevel,
      currentXp: unit.xp,
      requiredLevel,
    })
  }

  const allocation = allocateLevelXp(
    needs,
    params.inventoryXpBooks,
    params.xpBookRarity
  )
  const ratioByGoalId = new Map<string, number>()
  const chargedXpByGoalId = new Map<string, number>()
  const poolXpAvailableByGoalId = new Map<string, number>()
  const goldByGoalId = new Map<string, number>()
  for (const need of needs) {
    const result = allocation.get(need.goalId)
    if (!result) continue
    ratioByGoalId.set(
      need.goalId,
      levelPotentialRatio(
        need.currentLevel,
        result.potentialLevel,
        need.requiredLevel
      )
    )
    chargedXpByGoalId.set(need.goalId, result.chargedXp)
    poolXpAvailableByGoalId.set(need.goalId, result.poolXpAvailable)
    goldByGoalId.set(need.goalId, result.gold)
  }
  return {
    ratioByGoalId,
    chargedXpByGoalId,
    poolXpAvailableByGoalId,
    goldByGoalId,
  }
}
