import type { UnitId } from "@workspace/game-domain"

import type { GoalDetail } from "@/entities/goal"
import type { CreateGoalPrefill } from "../goal-creation-form/create-goal-launcher-context"
import type { BlockerReason } from ".//goal-blockers"

type MissingPrerequisite = Extract<
  BlockerReason,
  { kind: "MissingLevelPrerequisite" | "MissingAscensionPrerequisite" }
>

export function prerequisitePrefill(
  detail: GoalDetail,
  reason: MissingPrerequisite
): CreateGoalPrefill | null {
  if (detail.entityType === "Item") return null
  if (reason.kind === "MissingLevelPrerequisite") {
    if (detail.entityType !== "Character") return null
    return {
      entityType: "Character",
      entityId: detail.entityId as UnitId,
      goalType: "Level",
      requiredLevel: reason.requiredLevel,
      projectIds: detail.projectIds,
    }
  }
  return {
    entityType: detail.entityType,
    entityId: detail.entityId as UnitId,
    goalType: "Ascension",
    requiredProgression: reason.requiredProgression,
    projectIds: detail.projectIds,
  }
}
