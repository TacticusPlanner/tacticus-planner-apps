import {
  levelCapForProgression,
  type Progression,
} from "@workspace/game-domain"

import type { GoalDetail } from "@/entities/goal"
import {
  requiredLevelForGoal,
  xpNeededForLevelRange,
} from "@/features/goal-farming"

import type { GoalProgress } from "./goal-progress"

export type LevelRequirementProgress = Extract<
  GoalProgress,
  { kind: "LevelRequirement" }
>

/** Every character starts at level 1, so the requirement's bar runs from there to the required level. */
const LEVEL_FLOOR = 1

function clampRatio(done: number, total: number): number {
  if (total <= 0) return 1
  return Math.min(1, Math.max(0, done / total))
}

/** Where `level` sits on the requirement's bar (level 1 → the required level). */
export function levelRequirementRatio(
  level: number,
  requiredLevel: number
): number {
  return clampRatio(level - LEVEL_FLOOR, requiredLevel - LEVEL_FLOOR)
}

/** The level a Rank/Ability goal needs, shown next to that goal while the character is below it — the
 *  relocated "level requirement" display of what used to be a separate Level goal
 *  (integrate-level-progression-into-rank-goals). `null` when the goal has no level requirement, the
 *  character isn't owned, the level is already sufficient, or the goal is no longer in flight (a Paused
 *  goal still shows it; Completed and Archived ones don't). Never a blocker or a dependency: reaching
 *  the level alone completes nothing. */
export function computeLevelRequirementProgress(params: {
  detail: Pick<GoalDetail, "goalType" | "entityType" | "config" | "status">
  playerUnit:
    { xpLevel: number; xp: number; progressionIndex: string } | undefined
}): LevelRequirementProgress | null {
  const { detail, playerUnit } = params
  const required = requiredLevelForGoal(detail)
  const inFlight = detail.status === "Active" || detail.status === "Paused"
  if (
    !inFlight ||
    required === null ||
    !playerUnit ||
    playerUnit.xpLevel >= required
  ) {
    return null
  }

  // A character can't earn XP past its current rarity's level cap until it Ascends.
  const cap = levelCapForProgression(playerUnit.progressionIndex as Progression)
  const isRestricted = cap < required
  return {
    kind: "LevelRequirement",
    current: playerUnit.xpLevel,
    target: required,
    ratio: levelRequirementRatio(playerUnit.xpLevel, required),
    reachableRatio: isRestricted ? levelRequirementRatio(cap, required) : null,
    reachableLevel: isRestricted ? cap : null,
    remainingXp: xpNeededForLevelRange(
      playerUnit.xpLevel,
      playerUnit.xp,
      required
    ),
  }
}
