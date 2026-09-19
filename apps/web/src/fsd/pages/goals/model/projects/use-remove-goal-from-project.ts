import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { useIsAuthenticated } from "@azure/msal-react"

import { goalQueries, updateGoalProjects, type GoalKind } from "@/entities/goal"
import {
  projectQueries,
  useProjects,
  type ProjectSummary,
} from "@/entities/project"
import { ApiError } from "@/shared/api"
import { useUnitName } from "@/shared/unit-name"

import type { GoalRow } from "../shared/types"
import { projectGoalSlotConflictDetails } from "./project-membership"
import {
  planProjectRemoval,
  type ProjectRemovalPlan,
  type ProjectRemovalUnavailableReason,
} from "./project-removal"

/**
 * "Remove this goal from this project" — the non-destructive peer of Delete. Removing the goal's last
 * membership relocates it to the Default project (see `planProjectRemoval`), and the destination's
 * goal-type slot is pre-flighted before the mutation so a collision is explained rather than
 * surfacing as a raw 409. The 409 handler stays as the backstop for the race between the two.
 */
export function useRemoveGoalFromProject() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const isAuthenticated = useIsAuthenticated()
  const getUnitName = useUnitName()
  const { projects, defaultProjectId } = useProjects()
  const defaultProject = projects.find(
    (project) => project.projectId === defaultProjectId
  )
  const [pendingGoalId, setPendingGoalId] = useState<string | null>(null)

  const goalLabel = (goal: GoalRow) =>
    `${getUnitName(goal.entityType, goal.entityId)} · ${t(`goals.create.goalTypes.${goal.goalType}`)}`

  const unavailableMessage = (reason: ProjectRemovalUnavailableReason) =>
    reason === "lastMembershipIsDefault"
      ? t("goals.project.removeLastMembership")
      : t("goals.project.removeDestinationUnknown")

  const conflictMessage = (projectName: string, goalTypes: GoalKind[]) =>
    t("goals.project.membershipConflict", {
      project: projectName,
      types: goalTypes
        .map((goalType) => t(`goals.create.goalTypes.${goalType}`))
        .join(", "),
    })

  /** What the row menu renders with: membership as the row carries it, no destination pre-flight. */
  const planFor = (goal: GoalRow, projectId: string): ProjectRemovalPlan =>
    planProjectRemoval({
      memberships: (goal.projects ?? []).map((project) => project.projectId),
      projectId,
      defaultProject,
      goal,
    })

  const remove = async (goal: GoalRow, project: ProjectSummary) => {
    if (!isAuthenticated) return false
    setPendingGoalId(goal.goalId)
    try {
      // `PUT /me/goals/{goalId}/projects` replaces the whole list, so membership is read as it stands
      // now rather than trusted from the rendered row — otherwise a membership added elsewhere since
      // this view loaded would be silently dropped by this removal.
      const detail = await queryClient.fetchQuery(
        goalQueries.detail(goal.goalId)
      )
      const memberships = detail.projectIds
      const relocating = memberships.every((id) => id === project.projectId)
      const destinationGoals =
        relocating &&
        defaultProject &&
        defaultProject.projectId !== project.projectId
          ? (
              await queryClient.fetchQuery(
                projectQueries.goals(defaultProject.projectId)
              )
            ).goals
          : []
      const plan = planProjectRemoval({
        memberships,
        projectId: project.projectId,
        defaultProject,
        goal,
        destinationGoals,
      })

      if (plan.kind === "unavailable") {
        toast.error(unavailableMessage(plan.reason))
        return false
      }
      if (plan.kind === "conflict") {
        toast.error(
          conflictMessage(plan.destination.name, plan.conflict.goalTypes)
        )
        return false
      }

      await updateGoalProjects(goal.goalId, plan.projectIds)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: goalQueries.all() }),
        queryClient.invalidateQueries({ queryKey: projectQueries.all() }),
      ])
      toast.success(
        plan.kind === "relocate"
          ? t("goals.toasts.goalRelocated", {
              goal: goalLabel(goal),
              project: plan.destination.name,
            })
          : t("goals.toasts.goalRemovedFromProject", {
              goal: goalLabel(goal),
              project: project.name,
            })
      )
      return true
    } catch (error) {
      const conflict =
        error instanceof ApiError
          ? projectGoalSlotConflictDetails(error.details)
          : null
      toast.error(
        conflict
          ? conflictMessage(conflict.projectName, [
              conflict.goalType as GoalKind,
            ])
          : error instanceof ApiError
            ? error.message
            : t("goals.toasts.actionError")
      )
      return false
    } finally {
      setPendingGoalId(null)
    }
  }

  return { planFor, remove, pendingGoalId }
}
