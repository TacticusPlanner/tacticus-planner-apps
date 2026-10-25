import { useMemo } from "react"

import {
  goalTargetKeyOf,
  useGoalsById,
  type GoalDetail,
  type GoalKind,
} from "@/entities/goal"

const isInFlight = (status: string) =>
  status === "Active" || status === "Paused"

/** One goal about to be created (or a target being edited): its type and normalized end target. */
export type GoalSlotCandidate = { goalType: GoalKind; targetKey: string | null }

/**
 * The in-flight goal already holding a slot one of `candidates` needs, or null. The slot is per account,
 * whatever projects hold the goals: a goal conflicts only with an in-flight goal of the same unit and type
 * with the *same normalized end target* (`goalTargetKey`; distinct targets coexist), and Unlock — which
 * has no target key — once per unit. Candidates are checked in order, each against the account's goals;
 * the server stays authoritative (`slotOccupied`), also for two candidates of one request.
 */
export function findGoalSlotConflict({
  goals,
  entityType,
  entityId,
  candidates,
  excludeGoalId,
}: {
  goals: Iterable<GoalDetail>
  entityType: "Character" | "Mow"
  entityId: string
  candidates: readonly GoalSlotCandidate[]
  excludeGoalId?: string
}): GoalDetail | null {
  const occupants = [...goals].filter(
    (goal) =>
      goal.entityType === entityType &&
      goal.entityId === entityId &&
      goal.goalId !== excludeGoalId &&
      isInFlight(goal.status)
  )
  for (const candidate of candidates) {
    const occupant = occupants.find(
      (goal) =>
        goal.goalType === candidate.goalType &&
        goalTargetKeyOf(goal) === candidate.targetKey
    )
    if (occupant) return occupant
  }
  return null
}

/** {@link findGoalSlotConflict} over the account's goals list; `loading` until the list has loaded. */
export function useGoalSlotConflict({
  entityType,
  entityId,
  candidates,
  excludeGoalId,
  enabled = true,
}: {
  entityType: "Character" | "Mow"
  entityId: string | undefined
  candidates: readonly GoalSlotCandidate[]
  excludeGoalId?: string
  enabled?: boolean
}) {
  const { goalsById, loading } = useGoalsById()
  const active = Boolean(enabled && entityId && candidates.length > 0)
  const conflict = useMemo(
    () =>
      active && entityId
        ? findGoalSlotConflict({
            goals: goalsById.values(),
            entityType,
            entityId,
            candidates,
            excludeGoalId,
          })
        : null,
    [active, goalsById, entityType, entityId, candidates, excludeGoalId]
  )
  return { conflict, loading: active && loading }
}
