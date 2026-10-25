import type { CreateGoalPrefill, GoalDetail } from "@/entities/goal"
import { progressionOrder, type UnitId } from "@workspace/game-domain"

import type { ShardMeaning } from "@/features/quest-event"

export type QuestGoalAction =
  | { kind: "open"; goalId: string }
  | { kind: "create"; prefill: CreateGoalPrefill }

/**
 * The rewards card's goal shortcut (design D3): "Open goal" for the hero's active Unlock or Ascension
 * goal, else "Create goal" prefilled with an Unlock goal (not owned) or an Ascension goal to the last
 * step the quest's maximum covers (owned; the next step when it covers none).
 */
export function questGoalAction({
  heroId,
  owned,
  meaning,
  goals,
  currentProgression,
}: {
  heroId: string
  owned: boolean
  meaning: ShardMeaning
  goals: readonly GoalDetail[]
  currentProgression?: string
}): QuestGoalAction {
  const existing = goals.find(
    (goal) =>
      goal.entityId === heroId &&
      goal.status === "Active" &&
      (goal.goalType === "Unlock" || goal.goalType === "Ascension")
  )
  if (existing) return { kind: "open", goalId: existing.goalId }
  const entity = {
    entityType: "Character" as const,
    entityId: heroId as UnitId,
  }
  if (!owned)
    return { kind: "create", prefill: { ...entity, goalType: "Unlock" } }
  const last = meaning.kind === "ascend" ? meaning.steps.at(-1) : undefined
  const next =
    currentProgression !== undefined
      ? progressionOrder[
          progressionOrder.indexOf(currentProgression as never) + 1
        ]
      : undefined
  const target = last ?? next
  return target
    ? {
        kind: "create",
        prefill: {
          ...entity,
          goalType: "Ascension",
          requiredProgression: target,
        },
      }
    : { kind: "create", prefill: entity }
}
