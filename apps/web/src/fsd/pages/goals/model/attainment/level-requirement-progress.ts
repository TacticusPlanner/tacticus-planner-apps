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
function levelRequirementRatio(level: number, requiredLevel: number): number {
  return clampRatio(level - LEVEL_FLOOR, requiredLevel - LEVEL_FLOOR)
}

/** How much of the *remaining* gap from `currentLevel` to `requiredLevel` the account's owned XP
 * books could close right now (show-xp-book-availability-per-goal) — deliberately not
 * `levelRequirementRatio`, which is anchored at level 1 and would report a high ratio for a
 * near-target character even when zero books are actually available (e.g. level 44 of a 1→50
 * range reads ~88% on that absolute scale regardless of book availability). A goal that gets no
 * benefit from owned books (`potentialLevel === currentLevel`) SHALL read 0%, not the character's
 * unrelated absolute level position. */
export function levelPotentialRatio(
  currentLevel: number,
  potentialLevel: number,
  requiredLevel: number
): number {
  return clampRatio(potentialLevel - currentLevel, requiredLevel - currentLevel)
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
  /** The level a higher-priority goal of the same unit already covers up to, from the plan's level
   *  allocation (`PlanNetResources.levelChainedFrom`): the line then reads from it, not the current level. */
  chainedFrom?: number
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
    chainedFrom: params.chainedFrom,
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
