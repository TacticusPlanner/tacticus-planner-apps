import { useMemo } from "react"

import {
  goalRankTargetKey,
  useGoalsById,
  type GoalDetail,
  type GoalKind,
} from "@/entities/goal"

const isInFlight = (status: string) =>
  status === "Active" || status === "Paused"

/**
 * The in-flight goal already holding the slot a goal about to be created (or edited) needs, or null.
 * The slot is per account, whatever projects hold the goals: non-Rank goal types conflict per
 * `(unit, goalType)`; a Rank goal conflicts only with an in-flight Rank goal for the same unit with the
 * *same normalized end target* (distinct Rank targets coexist). Without the new Rank target no Rank
 * conflict is reported — the server stays authoritative (`slotOccupied`).
 */
export function findGoalSlotConflict({
  goals,
  entityType,
  entityId,
  goalTypes,
  excludeGoalId,
  rankTargetKey,
}: {
  goals: Iterable<GoalDetail>
  entityType: "Character" | "Mow"
  entityId: string
  goalTypes: readonly GoalKind[]
  excludeGoalId?: string
  rankTargetKey?: string | null
}): GoalDetail | null {
  for (const goal of goals) {
    if (
      goal.entityType === entityType &&
      goal.entityId === entityId &&
      goal.goalId !== excludeGoalId &&
      isInFlight(goal.status) &&
      goalTypes.includes(goal.goalType) &&
      (goal.goalType !== "Rank" ||
        (!!rankTargetKey && goalRankTargetKey(goal) === rankTargetKey))
    ) {
      return goal
    }
  }
  return null
}

/** {@link findGoalSlotConflict} over the account's goals list; `loading` until the list has loaded. */
export function useGoalSlotConflict({
  entityType,
  entityId,
  goalTypes,
  excludeGoalId,
  rankTargetKey,
  enabled = true,
}: {
  entityType: "Character" | "Mow"
  entityId: string | undefined
  goalTypes: readonly GoalKind[]
  excludeGoalId?: string
  /** The normalized end target of the Rank goal being placed; null/undefined when there is none. */
  rankTargetKey?: string | null
  enabled?: boolean
}) {
  const { goalsById, loading } = useGoalsById()
  const active = Boolean(enabled && entityId && goalTypes.length > 0)
  const conflict = useMemo(
    () =>
      active && entityId
        ? findGoalSlotConflict({
            goals: goalsById.values(),
            entityType,
            entityId,
            goalTypes,
            excludeGoalId,
            rankTargetKey,
          })
        : null,
    [
      active,
      goalsById,
      entityType,
      entityId,
      goalTypes,
      excludeGoalId,
      rankTargetKey,
    ]
  )
  return { conflict, loading: active && loading }
}
