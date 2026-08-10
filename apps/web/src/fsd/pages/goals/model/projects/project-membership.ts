import type { GoalKind } from "@/entities/goal"

export type ProjectMembershipConflict = {
  projectId: string
  existingGoalId: string
  goalTypes: GoalKind[]
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
