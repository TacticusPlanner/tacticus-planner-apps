import {
  minProgressionForRank,
  progressionIndex,
  progressionOrder,
  progressionRarity,
  rankAt,
  type Progression,
} from "@workspace/game-domain"

import type { GoalDetail } from "@/entities/goal"

import {
  additionalTargetFromWire,
  requiredLevelForRankTarget,
} from "@/features/goal-farming"
import { abilityLevelsByRarity } from "../goal-creation-form/goal-validation"
import type { BlockerReason } from ".//goal-blockers"

type PlayerUnit = {
  xpLevel: number
  progressionIndex: string
}

function minimumProgressionForAbilityLevel(level: number): Progression {
  const rarity =
    abilityLevelsByRarity.find((entry) => entry.level >= level)?.rarity ??
    abilityLevelsByRarity.at(-1)!.rarity
  return (
    progressionOrder.find(
      (progression) => progressionRarity(progression) === rarity
    ) ?? progressionOrder.at(-1)!
  )
}

function coveringLevelGoal(
  goals: readonly GoalDetail[],
  entityId: string,
  requiredLevel: number
) {
  return goals.find(
    (goal) =>
      goal.entityId === entityId &&
      goal.goalType === "Level" &&
      goal.status !== "Archived" &&
      (goal.config.level?.end ?? 0) >= requiredLevel
  )
}

function coveringAscensionGoal(
  goals: readonly GoalDetail[],
  entityId: string,
  requiredProgression: Progression
) {
  const requiredIndex = progressionIndex(requiredProgression)
  return goals.find(
    (goal) =>
      goal.entityId === entityId &&
      goal.goalType === "Ascension" &&
      goal.status !== "Archived" &&
      progressionIndex(goal.config.progression?.end as Progression) >=
        requiredIndex
  )
}

function conflictingGoalId(
  goals: readonly GoalDetail[],
  entityId: string,
  goalType: "Level" | "Ascension"
) {
  return goals.find(
    (goal) =>
      goal.entityId === entityId &&
      goal.goalType === goalType &&
      (goal.status === "Active" || goal.status === "Paused")
  )?.goalId
}

export function implicitPrerequisiteBlockers(params: {
  detail: GoalDetail
  playerUnit: PlayerUnit | undefined
  prerequisiteGoals: readonly GoalDetail[]
  ready: boolean
}): BlockerReason[] {
  if (!params.ready || !params.playerUnit) return []
  const { detail, playerUnit, prerequisiteGoals } = params

  let requiredLevel: number | null = null
  let requiredProgression: Progression | null = null

  if (detail.goalType === "Rank" && detail.config.rank) {
    const targetRank = rankAt(detail.config.rank.end)
    if (detail.entityType === "Character") {
      requiredLevel = requiredLevelForRankTarget(
        targetRank,
        additionalTargetFromWire(targetRank, detail.config.rank)
      )
    }
    requiredProgression = minProgressionForRank(targetRank)
  } else if (detail.goalType === "Ability" && detail.config.ability) {
    const targetLevel = Math.max(
      detail.config.ability.activeEnd,
      detail.config.ability.passiveEnd
    )
    if (detail.entityType === "Character") requiredLevel = targetLevel
    requiredProgression = minimumProgressionForAbilityLevel(targetLevel)
  }

  const reasons: BlockerReason[] = []
  if (
    requiredLevel !== null &&
    playerUnit.xpLevel < requiredLevel &&
    !coveringLevelGoal(prerequisiteGoals, detail.entityId, requiredLevel)
  ) {
    reasons.push({
      kind: "MissingLevelPrerequisite",
      requiredLevel,
      existingGoalId: conflictingGoalId(
        prerequisiteGoals,
        detail.entityId,
        "Level"
      ),
    })
  }

  if (
    requiredProgression !== null &&
    progressionIndex(playerUnit.progressionIndex as Progression) <
      progressionIndex(requiredProgression) &&
    !coveringAscensionGoal(
      prerequisiteGoals,
      detail.entityId,
      requiredProgression
    )
  ) {
    reasons.push({
      kind: "MissingAscensionPrerequisite",
      requiredProgression,
      existingGoalId: conflictingGoalId(
        prerequisiteGoals,
        detail.entityId,
        "Ascension"
      ),
    })
  }

  return reasons
}
