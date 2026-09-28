import type { GoalKind } from "@/entities/goal"

export type ProjectMembershipConflict = {
  projectId: string
  existingGoalId: string
  goalTypes: GoalKind[]
  /** Set when the conflict is an exact Rank end-target duplicate (the normalized `<rank>:<slots>` key);
   *  absent for a non-Rank goal-type conflict. */
  rankTargetKey?: string
}

export type ProjectGoalSlotConflictDetailsDto = {
  issueCode: "projectGoalSlotOccupied"
  message: string
  projectId: string
  projectName: string
  entityType: string
  entityId: string
  goalType: string
  existingGoalId: string
  // Rank slot conflicts: the occupied normalized end target, and every project holding it.
  normalizedTarget?: string | null
  conflicts?: {
    projectId: string
    projectName: string
    existingGoalId: string
  }[]
}

export function projectGoalSlotConflictDetails(
  details: unknown
): ProjectGoalSlotConflictDetailsDto | null {
  if (!details || typeof details !== "object") return null
  const value = details as Partial<ProjectGoalSlotConflictDetailsDto>
  return value.issueCode === "projectGoalSlotOccupied" &&
    typeof value.existingGoalId === "string" &&
    typeof value.projectId === "string" &&
    typeof value.projectName === "string" &&
    typeof value.entityType === "string" &&
    typeof value.entityId === "string" &&
    typeof value.goalType === "string" &&
    typeof value.message === "string"
    ? (value as ProjectGoalSlotConflictDetailsDto)
    : null
}
