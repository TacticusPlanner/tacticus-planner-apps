export type ProjectSummary = {
  projectId: string
  name: string
  description: string | null
  color: string | null
  status: "Active" | "Paused" | "Archived"
  isActivePlan: boolean
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export type CreateProjectRequest = {
  name: string
  description?: string | null
  color?: string | null
}

export type ProjectGoalEntry = {
  goalId: string
  priority: number
}
