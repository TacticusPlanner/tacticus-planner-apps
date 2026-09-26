import {
  allocateLevelXp,
  requiredLevelForGoal,
  type LevelXpNeed,
} from "@/features/goal-farming"
import type { GoalDetail } from "@/entities/goal"

import { levelRequirementRatio } from "../attainment/level-requirement-progress"

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
}): Map<string, number> {
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

  const allocation = allocateLevelXp(needs, params.inventoryXpBooks)
  const ratioByGoalId = new Map<string, number>()
  for (const need of needs) {
    const result = allocation.get(need.goalId)
    if (!result) continue
    ratioByGoalId.set(
      need.goalId,
      levelRequirementRatio(result.potentialLevel, need.requiredLevel)
    )
  }
  return ratioByGoalId
}
