import type { UnitId } from "@workspace/game-domain"

import type { GoalDetail } from "@/entities/goal"
import type { CreateGoalPrefill } from "../goal-creation-form/create-goal-launcher-context"
import type { BlockerReason } from ".//goal-blockers"

type MissingPrerequisite = Extract<
  BlockerReason,
  {
    kind: "MissingAscensionPrerequisite" | "MissingUnlockPrerequisite"
  }
>

export function prerequisitePrefill(
  detail: GoalDetail,
  reason: MissingPrerequisite
): CreateGoalPrefill | null {
  if (reason.kind === "MissingUnlockPrerequisite") {
    return {
      entityType: detail.entityType,
      entityId: detail.entityId as UnitId,
      goalType: "Unlock",
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
