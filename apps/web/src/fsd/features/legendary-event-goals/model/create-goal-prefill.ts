import {
  progressionIndex,
  rankIndex,
  type UnitId,
} from "@workspace/game-domain"

import type { CreateGoalPrefill } from "@/entities/goal"
import type {
  LeaderboardOwnership,
  LegendaryEventGoalTarget,
  UpgradeStep,
} from "@/entities/legendary-event"

/** The goal type a launch preselects, as the `legendary_event_create_goal_opened` event logs it. */
export type PrefillGoalType = "Unlock" | "Ascension" | "Rank" | null

/** A leaderboard row's Create goal (spec `goal-creation-entry-points`): a locked unit opens with
 *  Unlock; an owned unit, or one whose ownership is unknown, opens with no goal type. */
export function leaderboardRowPrefill(
  unitId: string,
  ownership: LeaderboardOwnership
): CreateGoalPrefill {
  const entity = {
    entityType: "Character",
    entityId: unitId as UnitId,
  } as const
  return ownership === "locked" ? { ...entity, goalType: "Unlock" } : entity
}

/** An Upgrade impact row's Create goal: the step's goal type and target, with no project context. */
export function upgradeStepPrefill(
  unitId: string,
  step: UpgradeStep
): CreateGoalPrefill {
  const entity = {
    entityType: "Character",
    entityId: unitId as UnitId,
  } as const
  switch (step.kind) {
    case "unlock":
      return { ...entity, goalType: "Unlock" }
    case "ascension":
      return {
        ...entity,
        goalType: "Ascension",
        requiredProgression: step.progression,
      }
    case "rank":
      return { ...entity, goalType: "Rank", rankEnd: step.rank }
  }
}

export function prefillGoalType(prefill: CreateGoalPrefill): PrefillGoalType {
  return "goalType" in prefill ? prefill.goalType : null
}

/** Whether the unit already has an Active goal whose target is at or beyond the step ("In goals"). */
export function stepInGoals(
  step: UpgradeStep,
  target: LegendaryEventGoalTarget | undefined
): boolean {
  const goals = target?.goals ?? []
  switch (step.kind) {
    case "unlock":
      // Any preview goal of a locked unit unlocks it first.
      return goals.length > 0
    case "ascension":
      return goals.some(
        (goal) =>
          goal.kind === "Ascension" &&
          goal.progressionEnd !== undefined &&
          progressionIndex(goal.progressionEnd) >=
            progressionIndex(step.progression)
      )
    case "rank":
      return goals.some(
        (goal) =>
          goal.kind === "Rank" &&
          goal.rankEnd !== undefined &&
          rankIndex(goal.rankEnd) >= rankIndex(step.rank)
      )
  }
}
