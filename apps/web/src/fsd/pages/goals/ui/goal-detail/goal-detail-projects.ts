import type { GoalDetail } from "@/entities/goal"
import type { ProjectSummary } from "@/entities/project"
import type { GoalProject } from "../../model/shared/types"

export function goalDetailProjects(
  detail: GoalDetail | null,
  projects: readonly ProjectSummary[]
): GoalProject[] {
  if (!detail) return []
  return detail.projectIds.flatMap((projectId) => {
    const project = projects.find(
      (candidate) => candidate.projectId === projectId
    )
    return project
      ? [
          {
            projectId: project.projectId,
            name: project.name,
            color: project.color,
            isActivePlan: project.isActivePlan,
          },
        ]
      : []
  })
}
