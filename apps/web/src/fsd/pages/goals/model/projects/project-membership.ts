export type ProjectMembershipConflict = {
  projectId: string
  existingGoalId: string
  goalTypes: string[]
}

export type ProjectGoalSlotConflictDetails = {
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
): ProjectGoalSlotConflictDetails | null {
  if (!details || typeof details !== "object") return null
  const value = details as Partial<ProjectGoalSlotConflictDetails>
  return value.issueCode === "projectGoalSlotOccupied" &&
    typeof value.existingGoalId === "string" &&
    typeof value.projectId === "string" &&
    typeof value.projectName === "string" &&
    typeof value.message === "string"
    ? (value as ProjectGoalSlotConflictDetails)
    : null
}
